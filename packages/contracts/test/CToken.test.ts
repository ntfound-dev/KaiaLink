import { expect } from "chai";
import { ethers, network } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { CToken, Comptroller, MockInterestRateModel, TestERC20 } from "../typechain-types";

const E18 = (n: number | string) => ethers.parseEther(String(n));

describe("Pengujian CToken.sol Anda", function () {
  let owner: HardhatEthersSigner, supplier: HardhatEthersSigner, borrower: HardhatEthersSigner, rogueBorrower: HardhatEthersSigner;
  let underlying: TestERC20;
  let comptroller: Comptroller;
  let interestRateModel: MockInterestRateModel;
  let cToken: CToken;

  const FIXED_BORROW_RATE = E18("0.000001"); // 0.0001% per block
  const DEFAULT_RESERVE_FACTOR = E18("0.1"); // 10%

  // Helper: coba peta nama parameter ke nilai yang masuk akal
  function guessParamValueByName(paramName: string, paramType: string, addrs: any) {
    const n = (paramName || "").toLowerCase();

    if (paramType.startsWith("address")) {
      if (n.includes("underlying")) return addrs.underlying;
      if (n.includes("comptroller")) return addrs.comptroller;
      if (n.includes("interest") || n.includes("rate")) return addrs.interestRateModel;
      if (n.includes("admin")) return addrs.admin;
      if (n.includes("impl") || n.includes("implementation")) return addrs.admin;
      // fallback
      return addrs.underlying;
    }

    if (paramType.startsWith("uint") || paramType === "uint256") {
      if (n.includes("initial") && n.includes("exchange")) return E18(1);
      if (n.includes("exchange") && !n.includes("initial")) return E18(1);
      if (n.includes("reserve")) return DEFAULT_RESERVE_FACTOR;
      if (n.includes("rate") && n.includes("borrow")) return FIXED_BORROW_RATE;
      if (n.includes("decimals")) return 18;
      return E18(1);
    }

    if (paramType === "uint8") {
      if (n.includes("decimals")) return 18;
      return 18;
    }

    if (paramType === "string") {
      if (n.includes("name")) return "cTest Token";
      if (n.includes("symbol")) return "cTST";
      return "cToken";
    }

    throw new Error(`Tidak tahu bagaimana mengisi param constructor dengan nama='${paramName}' type='${paramType}'`);
  }

  beforeEach(async () => {
    [owner, supplier, borrower, rogueBorrower] = await ethers.getSigners();

    // Deploy underlying token
    const TestERC20Factory = await ethers.getContractFactory("TestERC20");
    underlying = (await TestERC20Factory.deploy("Test Underlying", "TUL", 18)) as TestERC20;

    // Deploy Comptroller and InterestRateModel
    const ComptrollerFactory = await ethers.getContractFactory("Comptroller");
    comptroller = (await ComptrollerFactory.deploy(owner.address)) as Comptroller;

    const MockInterestRateModelFactory = await ethers.getContractFactory("MockInterestRateModel");
    interestRateModel = (await MockInterestRateModelFactory.deploy(FIXED_BORROW_RATE)) as MockInterestRateModel;

    // Prepare addresses map untuk tebakan argumen
    const addrs = {
      underlying: await underlying.getAddress(),
      comptroller: await comptroller.getAddress(),
      interestRateModel: await interestRateModel.getAddress(),
      admin: owner.address,
    };

    // Ambil ContractFactory dulu (menghindari hre.artifacts)
    const CTokenFactory = await ethers.getContractFactory("CToken");

    // Dapatkan constructor fragment dari interface ContractFactory
    // (ethers v6: fragments array)
    const constructorFragment: any = CTokenFactory.interface.fragments.find((f: any) => f.type === "constructor");
    const ctorInputs: any[] = constructorFragment ? (constructorFragment.inputs || []) : [];

    // Buat array argumen secara dinamis sesuai constructor ABI (heuristik)
    const deployArgs: any[] = [];
    for (const input of ctorInputs) {
      const guessed = guessParamValueByName(input.name || "", input.type, addrs);
      deployArgs.push(guessed);
    }

    // Debug optional: uncomment untuk lihat constructor dan args yang dipakai
    // console.log("CToken constructor inputs:", ctorInputs);
    // console.log("deployArgs:", deployArgs);

    // Lakukan deploy. Spread deployArgs agar cocok dengan signature apapun
    cToken = (await CTokenFactory.deploy(...deployArgs)) as CToken;

    // Jika contract tidak menerima reserveFactor di constructor, coba set setelah deploy
    async function trySetReserveFactor(mantissa: bigint) {
      try {
        if ((cToken as any)._setReserveFactor !== undefined) {
          await (cToken as any)._setReserveFactor(mantissa);
          return true;
        }
        if ((cToken as any)._setReserveFactorMantissa !== undefined) {
          await (cToken as any)._setReserveFactorMantissa(mantissa);
          return true;
        }
        if ((cToken as any).setReserveFactor !== undefined) {
          await (cToken as any).setReserveFactor(mantissa);
          return true;
        }
      } catch (err) {
        // ignore error; mungkin setter butuh admin/hak tertentu
      }
      return false;
    }

    const ctorHasReserve = ctorInputs.some((inp: any) => inp.name && inp.name.toLowerCase().includes("reserve"));
    if (!ctorHasReserve) {
      await trySetReserveFactor(DEFAULT_RESERVE_FACTOR).catch(() => { /* ignore */ });
    }

    // Support market and mint initial balances
    await comptroller._supportMarket(await cToken.getAddress());
    await underlying.mint(supplier.address, E18(10000));
    await underlying.mint(borrower.address, E18(1000));
  });

  describe("Fungsi Mint (Supply)", function () {
    it("Pengguna harus bisa menyetor token underlying dan menerima cToken", async () => {
      const mintAmount = E18(1000);
      await underlying.connect(supplier).approve(await cToken.getAddress(), mintAmount);

      await expect(() => cToken.connect(supplier).mint(mintAmount))
        .to.changeTokenBalances(
          underlying,
          [supplier, cToken],
          [-mintAmount, mintAmount]
        );

      expect(await cToken.balanceOf(supplier.address)).to.equal(mintAmount, "Saldo cToken supplier salah");
    });
  });

  describe("Fungsi Redeem", function () {
    const mintAmount = E18(1000);
    beforeEach(async () => {
      await underlying.connect(supplier).approve(await cToken.getAddress(), mintAmount);
      await cToken.connect(supplier).mint(mintAmount);
    });

    it("Pengguna harus bisa menukar cToken kembali menjadi underlying", async () => {
      const cTokenBalance = await cToken.balanceOf(supplier.address);

      const exRate = await cToken.exchangeRateStored(); // bigint
      const underlyingToReceive = (cTokenBalance * exRate) / E18(1);

      const beforeUnderlying = await underlying.balanceOf(supplier.address);
      const beforeCToken = await cToken.balanceOf(supplier.address);

      const cashBefore = await underlying.balanceOf(await cToken.getAddress());
      expect(cashBefore).to.be.gte(underlyingToReceive, "CToken: kontrak tidak memiliki cukup cash untuk redeem");

      await expect(cToken.connect(supplier).redeem(cTokenBalance)).not.to.be.reverted;

      const afterUnderlying = await underlying.balanceOf(supplier.address);
      const afterCToken = await cToken.balanceOf(supplier.address);

      expect(afterCToken).to.equal(beforeCToken - cTokenBalance);
      expect(afterUnderlying).to.equal(beforeUnderlying + underlyingToReceive);
    });
  });

  describe("Fungsi Borrow dan Repay", function () {
    beforeEach(async () => {
      await underlying.connect(supplier).approve(await cToken.getAddress(), E18(5000));
      await cToken.connect(supplier).mint(E18(5000));
      await comptroller.connect(borrower).enterMarkets([await cToken.getAddress()]);
    });

    it("Harus mengizinkan pengguna untuk meminjam jika diizinkan comptroller", async () => {
      const borrowAmount = E18(100);
      
      await expect(() => cToken.connect(borrower).borrow(borrowAmount))
        .to.changeTokenBalance(underlying, borrower, borrowAmount);

      expect(await cToken.totalBorrows()).to.equal(borrowAmount);
      expect(await cToken.borrowBalanceStored(borrower.address)).to.equal(borrowAmount);
    });
    
    it("Harus mengizinkan pengguna membayar kembali pinjamannya", async () => {
      const borrowAmount = E18(100);

      await expect(() => cToken.connect(borrower).borrow(borrowAmount))
        .to.changeTokenBalance(underlying, borrower, borrowAmount);

      await network.provider.send("evm_mine");

      await expect(cToken.exchangeRateCurrent()).not.to.be.reverted;

      let currentDebt: bigint = await cToken.borrowBalanceStored(borrower.address);
      expect(currentDebt).to.be.gte(borrowAmount);

      await underlying.connect(borrower).approve(await cToken.getAddress(), currentDebt);
      await expect(cToken.connect(borrower).repayBorrow(currentDebt)).not.to.be.reverted;

      let finalDebt: bigint = await cToken.borrowBalanceStored(borrower.address);
      let tries = 0;
      while (finalDebt > 0n && tries < 3) {
        await underlying.connect(borrower).approve(await cToken.getAddress(), finalDebt);
        await expect(cToken.connect(borrower).repayBorrow(finalDebt)).not.to.be.reverted;
        finalDebt = await cToken.borrowBalanceStored(borrower.address);
        tries++;
      }

      expect(finalDebt).to.equal(0n, "Sisa utang seharusnya nol setelah beberapa repay");

      const tb = await cToken.totalBorrows();
      expect(tb).to.be.gte(0n);
    });
  });

  describe("Pengujian Kegagalan (Edge Cases)", function () {
    beforeEach(async () => {
      await underlying.connect(supplier).approve(await cToken.getAddress(), E18(5000));
      await cToken.connect(supplier).mint(E18(5000));
    });

    it("Harus gagal (revert) jika pengguna mencoba meminjam tanpa masuk pasar (enter market)", async () => {
      const borrowAmount = E18(100);
      await expect(
        cToken.connect(rogueBorrower).borrow(borrowAmount)
      ).to.be.reverted;
    });
  });

  describe("Akumulasi Bunga dan Exchange Rate", function () {
    it("Harus mengakumulasi bunga dan menaikkan exchange rate", async () => {
      await underlying.connect(supplier).approve(await cToken.getAddress(), E18(10000));
      await cToken.connect(supplier).mint(E18(10000));
      await comptroller.connect(borrower).enterMarkets([await cToken.getAddress()]);
      await cToken.connect(borrower).borrow(E18(5000));

      const exRate1 = await cToken.exchangeRateStored();
      
      for (let i = 0; i < 1000; i++) {
        await network.provider.send("evm_mine");
      }

      await cToken.exchangeRateCurrent(); 
      const exRate2 = await cToken.exchangeRateStored();

      expect(exRate2).to.be.gt(exRate1, "Exchange rate seharusnya naik setelah bunga diakumulasi");

      const cTokenBalance = await cToken.balanceOf(supplier.address);
      const underlyingToGet = (cTokenBalance * exRate2) / E18(1);

      expect(underlyingToGet).to.be.gt(E18(10000), "Supplier seharusnya untung dari bunga");
    });
  });
});
