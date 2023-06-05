import axios, { AxiosInstance } from "axios";
import Decimal from "decimal.js";

// const url = "https://vardexpay.com/api/exchange/ratio";https://vardexpay.com/api/exchange/rates
const siteUrl = "https://vardexpay.com/api/";
const apiUrl = "https://api.vardexpay.com/";

export class vardexPay {
    private mainApi: AxiosInstance;
    private siteApi: AxiosInstance;
    private loggedIn: boolean = false;

    constructor() {
        this.mainApi = axios.create({
            baseURL: apiUrl,
            headers: {
                "Content-Type": "application/json"
            }
        })

        this.siteApi = axios.create({
            baseURL: siteUrl,
            headers: {
                "Content-Type": "application/json"
            }
        })
    }

    async login(email: string, password: string) {
        const returnData = await this.mainApi.post("/auth/login", {
            email,
            password
        })
        const data = returnData.data;
        if (!data) throw new Error('unknown-error')
        if (typeof data === 'object' && data.tfa) throw new Error('tfa-required');
        if (typeof data !== 'string') throw new Error('unknown-error');
        if (data !== 'Safality') throw new Error('response-error');

        const sessionData = returnData.headers["session"];
        if (!sessionData) throw new Error('invalid-credentials');

        this.mainApi.defaults.headers["session"] = sessionData;
        this.siteApi.defaults.headers["session"] = sessionData;
        this.loggedIn = true;

        return true
    }

    async getWallets() {
        if (!this.loggedIn) return null;
        const { data } = await this.mainApi.get("/profile/wallets");
        return data as GetWalletsResponse;
    }

    async withdrawCard(options: WithdrawCardOptions) {
        if (!this.loggedIn) return null;
        const { data } = await this.mainApi.post("/transfer/card", options);
        if (data === 'FillFields') throw new Error('fill-fields');
        if (data === 'InvalidCardNumber') throw new Error('invalid-card-number');
        if (data === 'NotEnoughMoney') throw new Error('not-enough-money');
        if (data === 'ActionLock') throw new Error('action-lock');
        if (data !== 'Safality') throw new Error('unknown-error');

        return data;
    }

    async withdrawCrypto(options: WithdrawCryptoOptions) {
        if (!this.loggedIn) return null;
        const { data } = await this.mainApi.post("/transfer/crypto", options);
        if (data === 'FillFields') throw new Error('fill-fields');
        if (data === 'NotEnoughMoney') throw new Error('not-enough-money');
        if (data === 'ActionLock') throw new Error('action-lock');
        if (data === 'AmountLimit') throw new Error('amount-limit');
        if (data !== 'Safality') throw new Error('unknown-error');

        return data;
    }

    async getRates() {
        const { data } = await this.siteApi.get("/exchange/rates");
        return data as RatesResponse[];
    }

    async transfersList() {
        if (!this.loggedIn) return null;
        const { data } = await this.mainApi.get("/transfer/list");
        return data as TransfersListResponse;
    }

    async getExchangeRatio(from: string, to: string, fromNetwork?: string, toNetwork?: string) {
        const { data } = await this.siteApi.post(`/exchange/ratio`, {
            from,
            fromNetwork,
            to,
            toNetwork
        })
        return data as ExchangeRatioResponse;
    }
}

type RatesResponse = {
    currency: string;
    minor: number,
    networks: string[];
    btc: number;
    usd: number;
}

type ExchangeRatioResponse = [number, number]

type transferStatuses = 'process' | 'success'
type transferTypes = 'transfer' | 'exchange' | 'top-up'

type Transfer = {
    _id: string;
    amount: number;
    from: {
        walletId: string;
        currency: string;
        network: string | null;
    },
    numId: number;
    status: transferStatuses;
    timestamp: number;
    to: {
        currency: string;
        receiver: {
            address: string;
            dest_tag: string;
        }
    },
    type: transferTypes
}

type TransfersListResponse = {
    transactions: Transfer[];
    wallets: Minor[];
}

type WithdrawCryptoOptions = {
    currency: string;
    amount: string;
    receiver: string;
}

type fiatCurrenciesWithoutEUR = 'USD' | 'RUB' | 'INR' | 'TRY'
type fiatCurrencies = 'USD' | 'RUB' | 'INR' | 'TRY' | 'EUR'

type WithdrawCardAdditional = {
    birthday: string;
    cardHolder: string;
    /* 
        Card expire date
        @example '12/25'
    */
    cardExpire: string;
}

type WithdrawCardOptions = {
    currency: fiatCurrenciesWithoutEUR;
    amount: string;
    /* Card Number */
    receiver: string;
    /* 
        Card issuer country
        @example 'ru'
    */
    country: string;
    /* Additional data if currency is EUR */
    additional?: WithdrawCardAdditional;
} | {
    currency: 'EUR';
    amount: string;
    /* Card Number */
    receiver: string;
    /*
        Card issuer country
        @example 'ru'
    */
    country: string;
    /* Additional data if currency is EUR */
    additional: WithdrawCardAdditional;
}

interface Minor {
    [key: string]: number
}

interface Wallet {
    /* Inner wallet ID */
    _id?: string,
    /* Wallet type */
    type: 'crypto' | 'fiat',
    /* Wallet network */
    network: string | null,
    /* Wallet currency */
    currency: string,
    /* Wallet balance */
    balance: number 
}

type GetWalletsResponse = {
    baseBalance: string;
    baseCurrency: string;
    minors: Minor;
    wallets: Wallet[];
}