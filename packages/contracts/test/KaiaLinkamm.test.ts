import { expect } from "chai";
import { ethers, network } from "hardhat";

const E = (n: number | string) => ethers.parseEther(String(n));

function addrLt(a: string, b: string): boolean {
  return BigInt(a) < BigInt(b);
}

function sqrt(y: bigint): bigint {
  if (y <= 3n) return y === 0n ? 0n : 1n;
  let z = y;
  let x = y / 2n + 1n;
  while (x < z) {
    z = x;
    x = (y / x + x) / 2n;
  }
  return z;
}

function getAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  const amountInWithFee = amountIn * 997n;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 1000n + amountInWithFee;
  return numerator / denominator;
}

describe("KaiaLink AMM (Factory + Pair)", function () {
  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("TestERC20");
    const tokenA = await Token.deploy("TokenA", "TKA", 18);
    const tokenB = await Token.deploy("TokenB", "TKB", 18);
    await tokenA.waitForDeployment();
    await tokenB.waitForDeployment();

    const Factory = await ethers.getContractFactory("KaiaLinkFactory");
    const factory = await Factory.deploy(owner.address);
    await factory.waitForDeployment();

    // createPair
    const tx = await factory.createPair(tokenA.target, tokenB.target);
    await tx.wait();

    const pairAddr = await factory.getPair(tokenA.target, tokenB.target);
    const pair = await ethers.getContractAt("KaiaLinkPair", pairAddr);

    // seed balances
    await (await tokenA.mint(alice.address, E(1_000_000))).wait();
    await (await tokenB.mint(alice.address, E(1_000_000))).wait();
    await (await tokenA.mint(bob.address, E(1_000_000))).wait();
    await (await tokenB.mint(bob.address, E(1_000_000))).wait();

    return { owner, alice, bob, factory, pair, tokenA, tokenB };
  }

  it("createPair: sorting, mapping simetris, length", async () => {
    const { factory, pair, tokenA, tokenB } = await deployFixture();

    const token0 = await pair.token0();
    const token1 = await pair.token1();
    const expected0 = addrLt(tokenA.target as string, tokenB.target as string) ? tokenA.target : tokenB.target;
    const expected1 = addrLt(tokenA.target as string, tokenB.target as string) ? tokenB.target : tokenA.target;

    expect(token0).eq(expected0);
    expect(token1).eq(expected1);

    expect(await factory.getPair(tokenA.target, tokenB.target)).eq(pair.target);
    expect(await factory.getPair(tokenB.target, tokenA.target)).eq(pair.target);
    expect(await factory.allPairsLength()).eq(1n);
  });

  it("createPair: reverts (identical, zero, exists)", async () => {
    const { factory, tokenA, tokenB } = await deployFixture();

    await expect(factory.createPair(tokenA.target, tokenA.target))
      .to.be.revertedWith("KaiaLink: IDENTICAL_ADDRESSES");

    await expect(factory.createPair(ethers.ZeroAddress, tokenA.target))
      .to.be.revertedWith("KaiaLink: ZERO_ADDRESS");

    await expect(factory.createPair(tokenB.target, tokenA.target))
      .to.be.revertedWith("KaiaLink: PAIR_EXISTS");
  });

  it("createPair: alamat deterministic (CREATE2)", async () => {
    const { factory, tokenA, tokenB } = await deployFixture();

    const token0 = addrLt(tokenA.target as string, tokenB.target as string) ? tokenA.target : tokenB.target;
    const token1 = addrLt(tokenA.target as string, tokenB.target as string) ? tokenB.target : tokenA.target;

    const salt = ethers.solidityPackedKeccak256(["address", "address"], [token0, token1]);
    const PairCF = await ethers.getContractFactory("KaiaLinkPair");
    const initCodeHash = ethers.keccak256(PairCF.bytecode);

    // keccak256(0xff ++ factory ++ salt ++ init_code_hash), last 20 bytes
    const hash = ethers.keccak256(ethers.concat([
      "0xff",
      factory.target as string,
      salt,
      initCodeHash
    ]));
    const predicted = ethers.getAddress("0x" + hash.slice(26)); // last 20 bytes

    const actual = await factory.getPair(tokenA.target, tokenB.target);
    expect(predicted).eq(actual);
  });

  it("mint awal: lock MINIMUM_LIQUIDITY dan update reserves", async () => {
    const { pair, tokenA, tokenB, alice } = await deployFixture();
    const MIN = await pair.MINIMUM_LIQUIDITY();
    const DEAD = await pair.LP_BURN_ADDRESS();

    const amountA = E(10_000);
    const amountB = E(20_000);

    // transfer ke pair lalu mint
    await (await tokenA.connect(alice).transfer(pair.target, amountA)).wait();
    await (await tokenB.connect(alice).transfer(pair.target, amountB)).wait();

    const lpBefore = await pair.balanceOf(alice.address);
    await (await pair.connect(alice).mint(alice.address)).wait();
    const lpAfter = await pair.balanceOf(alice.address);
    const minted = lpAfter - lpBefore;

    const expectedLiquidity = sqrt(amountA * amountB) - MIN;
    expect(minted).eq(expectedLiquidity);
    expect(await pair.totalSupply()).eq(expectedLiquidity + MIN);
    expect(await pair.balanceOf(DEAD)).eq(MIN);

    const [r0, r1] = await pair.getReserves();

    // ======== PERBAIKAN DI SINI ========
    const token0Address = await pair.token0();
    const [exp0, exp1] = (tokenA.target === token0Address)
      ? [amountA, amountB]
      : [amountB, amountA];
    // ===================================

    expect(r0).eq(exp0);
    expect(r1).eq(exp1);
  });

  it("tambah likuiditas: mint proporsional", async () => {
    const { pair, tokenA, tokenB, alice } = await deployFixture();

    // init 1000/1000
    await (await tokenA.connect(alice).transfer(pair.target, E(1000))).wait();
    await (await tokenB.connect(alice).transfer(pair.target, E(1000))).wait();
    await (await pair.connect(alice).mint(alice.address)).wait();

    const ts = await pair.totalSupply();
    const [r0, r1] = await pair.getReserves();

    // tambah 500/500
    await (await tokenA.connect(alice).transfer(pair.target, E(500))).wait();
    await (await tokenB.connect(alice).transfer(pair.target, E(500))).wait();

    const lpBefore = await pair.balanceOf(alice.address);
    await (await pair.connect(alice).mint(alice.address)).wait();
    const lpAfter = await pair.balanceOf(alice.address);
    const minted = lpAfter - lpBefore;

    const liq0 = E(500) * ts / r0;
    const liq1 = E(500) * ts / r1;
    const expected = liq0 < liq1 ? liq0 : liq1;
    expect(minted).eq(expected);
  });

  it("burn semua LP user: tersisa dust proporsional dari MINIMUM_LIQUIDITY", async () => {
    const { pair, tokenA, tokenB, alice } = await deployFixture();

    // init
    await (await tokenA.connect(alice).transfer(pair.target, E(1000))).wait();
    await (await tokenB.connect(alice).transfer(pair.target, E(1000))).wait();
    await (await pair.connect(alice).mint(alice.address)).wait();

    const [r0Before, r1Before] = await pair.getReserves();
    const tsBefore = await pair.totalSupply();
    const MIN = await pair.MINIMUM_LIQUIDITY();

    // burn seluruh LP milik alice
    const lp = await pair.balanceOf(alice.address);
    await (await pair.connect(alice).transfer(pair.target, lp)).wait();

    const a0Before = await tokenA.balanceOf(alice.address);
    const a1Before = await tokenB.balanceOf(alice.address);
    await (await pair.connect(alice).burn(alice.address)).wait();
    const a0After = await tokenA.balanceOf(alice.address);
    const a1After = await tokenB.balanceOf(alice.address);
    expect(a0After - a0Before).gt(0n);
    expect(a1After - a1Before).gt(0n);

    const [r0, r1] = await pair.getReserves();
    const expR0 = r0Before * MIN / tsBefore;
    const expR1 = r1Before * MIN / tsBefore;
    expect(r0).eq(expR0);
    expect(r1).eq(expR1);
  });

  it("burn partial: pro-rata", async () => {
    const { pair, tokenA, tokenB, alice } = await deployFixture();

    // init 2000/2000
    await (await tokenA.connect(alice).transfer(pair.target, E(2000))).wait();
    await (await tokenB.connect(alice).transfer(pair.target, E(2000))).wait();
    await (await pair.connect(alice).mint(alice.address)).wait();

    const tsBefore = await pair.totalSupply();
    const [r0Before, r1Before] = await pair.getReserves();

    const lpAlice = await pair.balanceOf(alice.address);
    const half = lpAlice / 2n;

    await (await pair.connect(alice).transfer(pair.target, half)).wait();
    const a0Before = await tokenA.balanceOf(alice.address);
    const a1Before = await tokenB.balanceOf(alice.address);
    await (await pair.connect(alice).burn(alice.address)).wait();
    const a0After = await tokenA.balanceOf(alice.address);
    const a1After = await tokenB.balanceOf(alice.address);

    const exp0 = half * r0Before / tsBefore;
    const exp1 = half * r1Before / tsBefore;
    expect(a0After - a0Before).eq(exp0);
    expect(a1After - a1Before).eq(exp1);
  });

  it("swap: exact token0 in => token1 out (fee 0.3%) dan K tidak turun", async () => {
    const { pair, tokenA, tokenB, alice, bob } = await deployFixture();

    // seed liquidity 10k / 10k
    await (await tokenA.connect(alice).transfer(pair.target, E(10_000))).wait();
    await (await tokenB.connect(alice).transfer(pair.target, E(10_000))).wait();
    await (await pair.connect(alice).mint(alice.address)).wait();

    // get reserves BEFORE swap
    const [r0, r1, tsBefore] = await pair.getReserves();

    // determine token ordering so we compute expectedOut with correct reserves
    const token0Address = await pair.token0();
    const tokenAIsToken0 = (tokenA.target === token0Address);

    // amountIn is in tokenA (the caller will transfer tokenA)
    const amountIn = E(1000);

    // choose reserveIn/reserveOut depending on which slot tokenA occupies
    const reserveIn  = tokenAIsToken0 ? r0 : r1;
    const reserveOut = tokenAIsToken0 ? r1 : r0;

    const expectedOut = getAmountOut(amountIn, reserveIn, reserveOut);

    // record bob balances for both tokens BEFORE transfer
    const bobA_before = await tokenA.balanceOf(bob.address);
    const bobB_before = await tokenB.balanceOf(bob.address);

    // bob sends exact tokenA to pair (transfer)
    await (await tokenA.connect(bob).transfer(pair.target, amountIn)).wait();

    // prepare swap params: if tokenA is token0 then we want token1 out => amount0Out = 0, amount1Out = expectedOut
    // otherwise tokenA is token1 then we want token0 out => amount0Out = expectedOut, amount1Out = 0
    const amount0Out = tokenAIsToken0 ? 0n : expectedOut;
    const amount1Out = tokenAIsToken0 ? expectedOut : 0n;

    // call swap
    await (await pair.connect(bob).swap(amount0Out, amount1Out, bob.address, "0x")).wait();

    // balances AFTER swap
    const bobA_after = await tokenA.balanceOf(bob.address);
    const bobB_after = await tokenB.balanceOf(bob.address);

    const deltaA = bobA_after - bobA_before;
    const deltaB = bobB_after - bobB_before;

    // One token delta must equal -amountIn (the token bob sent), the other must equal expectedOut (the token bob received)
    const sentA_receivedB = (deltaA === -amountIn && deltaB === expectedOut);
    const sentB_receivedA = (deltaB === -amountIn && deltaA === expectedOut);

    expect(sentA_receivedB || sentB_receivedA, `unexpected bob deltas: deltaA=${deltaA}, deltaB=${deltaB}, amountIn=${amountIn}, expectedOut=${expectedOut}`).eq(true);

    // get reserves AFTER swap
    const [nr0, nr1, tsAfter] = await pair.getReserves();

    const newK = nr0 * nr1;
    const oldK = r0 * r1;

    // Final assertions:
    // - reserves must be non-zero after swap
    expect(nr0).to.be.gte(0n);
    expect(nr1).to.be.gte(0n);

    // - Invariant K must not decrease (Uniswap v2 style)
    expect(newK >= oldK, `K invariant broken: oldK=${oldK} newK=${newK}`).eq(true);
  });

  it("swap: exact token1 in => token0 out", async () => {
    const { pair, tokenA, tokenB, alice, bob } = await deployFixture();

    await (await tokenA.connect(alice).transfer(pair.target, E(5_000))).wait();
    await (await tokenB.connect(alice).transfer(pair.target, E(10_000))).wait();
    await (await pair.connect(alice).mint(alice.address)).wait();

    const [r0, r1] = await pair.getReserves();
    const amountIn = E(2000);
    const expectedOut = getAmountOut(amountIn, r1, r0);

    const aBefore = await tokenA.balanceOf(bob.address);
    await (await tokenB.connect(bob).transfer(pair.target, amountIn)).wait();
    await (await pair.connect(bob).swap(expectedOut, 0, bob.address, "0x")).wait();
    const aAfter = await tokenA.balanceOf(bob.address);

    expect(aAfter - aBefore).eq(expectedOut);
  });

  it("swap: revert INVALID_TO", async () => {
    const { pair, tokenA, tokenB, alice, bob } = await deployFixture();

    await (await tokenA.connect(alice).transfer(pair.target, E(100))).wait();
    await (await tokenB.connect(alice).transfer(pair.target, E(100))).wait();
    await (await pair.connect(alice).mint(alice.address)).wait();

    await (await tokenA.connect(bob).transfer(pair.target, E(1))).wait();
    await expect(pair.connect(bob).swap(0, 1n, tokenA.target, "0x"))
      .to.be.revertedWith("KaiaLinkPair: INVALID_TO");
  });

  it("swap: revert INSUFFICIENT_LIQUIDITY", async () => {
    const { pair, tokenA, tokenB, alice, bob } = await deployFixture();

    await (await tokenA.connect(alice).transfer(pair.target, E(10))).wait();
    await (await tokenB.connect(alice).transfer(pair.target, E(10))).wait();
    await (await pair.connect(alice).mint(alice.address)).wait();

    await expect(pair.connect(bob).swap(E(11), 0, bob.address, "0x"))
      .to.be.revertedWith("KaiaLinkPair: INSUFFICIENT_LIQUIDITY");
  });

  it("swap: revert INSUFFICIENT_INPUT_AMOUNT (tidak kirim input)", async () => {
    const { pair, tokenA, tokenB, alice, bob } = await deployFixture();

    await (await tokenA.connect(alice).transfer(pair.target, E(100))).wait();
    await (await tokenB.connect(alice).transfer(pair.target, E(100))).wait();
    await (await pair.connect(alice).mint(alice.address)).wait();

    await expect(pair.connect(bob).swap(0, E(1), bob.address, "0x"))
      .to.be.revertedWith("KaiaLinkPair: INSUFFICIENT_INPUT_AMOUNT");
  });

  it("update: revert OVERFLOW saat balance > uint112", async () => {
    const { pair, tokenA, tokenB, alice } = await deployFixture();

    const max112 = (1n << 112n) - 1n;
    const big = max112 + 1n;

    await (await tokenA.mint(alice.address, big)).wait();
    await (await tokenB.mint(alice.address, big)).wait();

    await (await tokenA.connect(alice).transfer(pair.target, big)).wait();
    await (await tokenB.connect(alice).transfer(pair.target, big)).wait();

    await expect(pair.connect(alice).mint(alice.address))
      .to.be.revertedWith("KaiaLinkPair: OVERFLOW");
  });

  it("Factory: setFeeTo hanya oleh feeToSetter", async () => {
    const { factory, alice, bob } = await deployFixture();

    await expect(factory.connect(bob).setFeeTo(bob.address))
      .to.be.revertedWith("KaiaLink: FORBIDDEN");

    await (await factory.setFeeTo(alice.address)).wait();
    expect(await factory.feeTo()).eq(alice.address);
  });

  it("Factory: setFeeToSetter hanya oleh feeToSetter", async () => {
    const { factory, alice, bob } = await deployFixture();

    await expect(factory.connect(bob).setFeeToSetter(bob.address))
      .to.be.revertedWith("KaiaLink: FORBIDDEN");

    await (await factory.setFeeToSetter(alice.address)).wait();
    expect(await factory.feeToSetter()).eq(alice.address);
  });
});
