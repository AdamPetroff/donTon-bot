import BN from "bn.js";
import {
  Address,
  Cell,
  CellMessage,
  InternalMessage,
  CommonMessageInfo,
  WalletContract,
  SendMode,
  Wallet,
  beginCell,
} from "ton";
import { SmartContract } from "ton-contract-executor";
import Prando from "prando";
export const zeroAddress = new Address(0, Buffer.alloc(32, 0));

export function randomAddress(seed: string, workchain?: number) {
  const random = new Prando(seed);
  const hash = Buffer.alloc(32);
  for (let i = 0; i < hash.length; i++) {
    hash[i] = random.nextInt(0, 255);
  }
  return new Address(workchain ?? 0, hash);
}

// used with ton-contract-executor (unit tests) to sendInternalMessage easily
export function internalMessage(params: {
  from?: Address;
  to?: Address;
  value?: BN;
  bounce?: boolean;
  body?: Cell;
}) {
  const message = params.body ? new CellMessage(params.body) : undefined;
  return new InternalMessage({
    from: params.from ?? randomAddress("sender"),
    to: params.to ?? zeroAddress,
    value: params.value ?? 0,
    bounce: params.bounce ?? true,
    body: new CommonMessageInfo({ body: message }),
  });
}

// temp fix until ton-contract-executor (unit tests) remembers c7 value between calls
export function setBalance(contract: SmartContract, balance: BN) {
  contract.setC7Config({
    balance: balance,
  });
}

// helper for end-to-end on-chain tests (normally post deploy) to allow sending InternalMessages to contracts using a wallet
export async function sendInternalMessageWithWallet(params: {
  walletContract: WalletContract;
  secretKey: Buffer;
  to: Address;
  value: BN;
  bounce?: boolean;
  body?: Cell;
}) {
  const message = params.body ? new CellMessage(params.body) : undefined;
  const seqno = await params.walletContract.getSeqNo();
  const transfer = params.walletContract.createTransfer({
    secretKey: params.secretKey,
    seqno: seqno,
    sendMode: SendMode.PAY_GAS_SEPARATLY + SendMode.IGNORE_ERRORS,
    order: new InternalMessage({
      to: params.to,
      value: params.value,
      bounce: params.bounce ?? false,
      body: new CommonMessageInfo({
        body: message,
      }),
    }),
  });
  await params.walletContract.client.sendExternalMessage(
    params.walletContract,
    transfer
  );
  for (let attempt = 0; attempt < 10; attempt++) {
    await sleep(2000);
    const seqnoAfter = await params.walletContract.getSeqNo();
    if (seqnoAfter > seqno) return;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// encode contract storage according to save_data() contract method
export function data(params: {
  ownerAddress: Address;
  player_counter: number;
  playing: number;
}): Cell {
  return beginCell()
    .storeAddress(params.ownerAddress)
    .storeUint(params.player_counter, 64)
    .storeUint(params.playing, 64)
    .endCell();
}

// message encoders for all ops (see contracts/imports/constants.fc for consts)

export function register(): Cell {
  return beginCell().storeUint(0x4dcbb5a8, 32).storeUint(0, 64).endCell();
}

export function start(): Cell {
  return beginCell().storeUint(0x4349f57a, 32).storeUint(0, 64).endCell();
}

export function invest(params: { withdrawAmount: BN }): Cell {
  return beginCell()
    .storeUint(0x165389ea, 32)
    .storeUint(0, 64)
    .storeCoins(params.withdrawAmount)
    .endCell();
}

export function winner(params: { winnerAddress: Address }): Cell {
  return beginCell()
    .storeUint(0x586578f4, 32)
    .storeUint(0, 64)
    .storeAddress(params.winnerAddress)
    .endCell();
}

export function transferOwnership(params: { newOwnerAddress: Address }): Cell {
  return beginCell()
    .storeUint(0x2da38aaf, 32)
    .storeUint(0, 64)
    .storeAddress(params.newOwnerAddress)
    .endCell();
}
