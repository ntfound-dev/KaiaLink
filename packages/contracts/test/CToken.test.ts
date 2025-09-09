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

  beforeEach(async () => {
    [owner, supplier, borrower, rogueBorrower] = await ethers.getSigners();

    const TestERC20Factory = await ethers.getContractFactory("TestERC20");
    underlying = await TestERC20Factory.deploy("Test Underlying", "TUL", 18);

    const ComptrollerFactory = await ethers.getContractFactory("Comptroller");
    comptroller = await ComptrollerFactory.deploy(owner.address);

    const MockInterestRateModelFactory = await ethers.getContractFactory("MockInterestRateModel");
    interestRateModel = await MockInterestRateModelFactory.deploy(FIXED_BORROW_RATE);
    
    const CTokenFactory = await ethers.getContractFactory("CToken");
    cToken = await CTokenFactory.deploy(
      await underlying.getAddress(),
      await comptroller.getAddress(),
      await interestRateModel.getAddress(),
      E18(1),      // initialExchangeRateMantissa (1:1)
      E18("0.1"),  // reserveFactorMantissa (10%)
      "cTest Token",
      "cTST"
    );

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

      // Debug / safety: pastikan kontrak punya kas yang cukup sebelum redeem
      const cashBefore = await underlying.balanceOf(await cToken.getAddress());
      expect(cashBefore).to.be.gte(underlyingToReceive, "CToken: kontrak tidak memiliki cukup cash untuk redeem");

      // Panggil redeem sekali
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

      // 1) Borrow
      await expect(() => cToken.connect(borrower).borrow(borrowAmount))
        .to.changeTokenBalance(underlying, borrower, borrowAmount);

      // 2) Tambah beberapa blok (opsional) supaya bunga muncul sedikit
      await network.provider.send("evm_mine");

      // 3) Paksa akrual bunga agar stored values terupdate
      await expect(cToken.exchangeRateCurrent()).not.to.be.reverted;

      // 4) Ambil current debt (stored)
      let currentDebt: bigint = await cToken.borrowBalanceStored(borrower.address);
      expect(currentDebt).to.be.gte(borrowAmount);

      // 5) Approve dan repay pertama kali (pakai jumlah yang kita baca)
      await underlying.connect(borrower).approve(await cToken.getAddress(), currentDebt);
      await expect(cToken.connect(borrower).repayBorrow(currentDebt)).not.to.be.reverted;

      // 6) Jika masih ada sisa karena bunga kecil di antara operasi, lakukan repay tambahan (maks 3 kali)
      let finalDebt: bigint = await cToken.borrowBalanceStored(borrower.address);
      let tries = 0;
      while (finalDebt > 0n && tries < 3) {
        await underlying.connect(borrower).approve(await cToken.getAddress(), finalDebt);
        await expect(cToken.connect(borrower).repayBorrow(finalDebt)).not.to.be.reverted;
        finalDebt = await cToken.borrowBalanceStored(borrower.address);
        tries++;
      }

      // 7) Seharusnya lunas
      expect(finalDebt).to.equal(0n, "Sisa utang seharusnya nol setelah beberapa repay");

      // tambahan: totalBorrows turun sesuai jumlah yang dilunasi
      // (optional) cek minimal bahwa totalBorrows tidak negatif
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
