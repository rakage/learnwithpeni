import CryptoJS from "crypto-js";

// Duitku Configuration
export const DUITKU_CONFIG = {
  MERCHANT_CODE: process.env.DUITKU_MERCHANT_CODE || "DS24219",
  API_KEY: process.env.DUITKU_API_KEY || "d2547323e018a40ddfd10d81923823ca",
  SANDBOX_URL: "https://sandbox.duitku.com/webapi/api/merchant",
  PRODUCTION_URL: "https://passport.duitku.com/webapi/api/merchant",
  // Use a specific environment variable for Duitku production mode
  // This allows you to use sandbox even when deployed to production
  IS_PRODUCTION: process.env.DUITKU_ENVIRONMENT === "production",
};

export const DUITKU_ENDPOINTS = {
  GET_PAYMENT_METHODS: "/paymentmethod/getpaymentmethod",
  CREATE_TRANSACTION: "/v2/inquiry",
  CHECK_TRANSACTION: "/transactionStatus",
};

// Types
export interface DuitkuPaymentMethod {
  paymentMethod: string;
  paymentName: string;
  paymentImage: string;
  totalFee: string;
}

export interface DuitkuPaymentMethodsResponse {
  paymentFee: DuitkuPaymentMethod[];
  responseCode: string;
  responseMessage: string;
}

export interface DuitkuItemDetail {
  name: string;
  price: number;
  quantity: number;
}

export interface DuitkuCustomerAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  countryCode: string;
}

export interface DuitkuCustomerDetail {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  billingAddress: DuitkuCustomerAddress;
  shippingAddress: DuitkuCustomerAddress;
}

export interface DuitkuTransactionRequest {
  merchantCode: string;
  paymentAmount: number;
  paymentMethod: string;
  merchantOrderId: string;
  productDetails: string;
  additionalParam?: string;
  merchantUserInfo?: string;
  customerVaName: string;
  email: string;
  phoneNumber?: string;
  itemDetails?: DuitkuItemDetail[];
  customerDetail?: DuitkuCustomerDetail;
  returnUrl: string;
  callbackUrl: string;
  signature: string;
  expiryPeriod?: number;
}

export interface DuitkuTransactionResponse {
  merchantCode: string;
  reference: string;
  paymentUrl: string;
  vaNumber?: string;
  qrString?: string;
  amount: string;
  statusCode: string;
  statusMessage: string;
}

export interface DuitkuCallbackData {
  merchantCode: string;
  amount: string;
  merchantOrderId: string;
  productDetails: string;
  additionalParam?: string;
  paymentCode: string;
  resultCode: string;
  merchantUserId?: string;
  reference: string;
  signature: string;
  publisherOrderId?: string;
  spUserHash?: string;
  settlementDate?: string;
  issuerCode?: string;
}

export interface DuitkuTransactionStatusRequest {
  merchantCode: string;
  merchantOrderId: string;
  signature: string;
}

export interface DuitkuTransactionStatusResponse {
  merchantOrderId: string;
  reference: string;
  amount: string;
  fee: string;
  statusCode: string;
  statusMessage: string;
}

// Utility Functions
export class DuitkuHelper {
  private static getBaseUrl(): string {
    return DUITKU_CONFIG.IS_PRODUCTION
      ? DUITKU_CONFIG.PRODUCTION_URL
      : DUITKU_CONFIG.SANDBOX_URL;
  }

  private static getCurrentDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // Generate signature for Get Payment Methods
  static generatePaymentMethodSignature(
    merchantCode: string,
    amount: number,
    datetime: string,
    apiKey: string
  ): string {
    const plainText = `${merchantCode}${amount}${datetime}${apiKey}`;
    return CryptoJS.SHA256(plainText).toString();
  }

  // Generate signature for Transaction Request
  static generateTransactionSignature(
    merchantCode: string,
    merchantOrderId: string,
    paymentAmount: number,
    apiKey: string
  ): string {
    const plainText = `${merchantCode}${merchantOrderId}${paymentAmount}${apiKey}`;
    return CryptoJS.MD5(plainText).toString();
  }

  // Generate signature for Transaction Status Check
  static generateStatusSignature(
    merchantCode: string,
    merchantOrderId: string,
    apiKey: string
  ): string {
    const plainText = `${merchantCode}${merchantOrderId}${apiKey}`;
    return CryptoJS.MD5(plainText).toString();
  }

  // Validate callback signature
  static validateCallbackSignature(
    merchantCode: string,
    amount: string,
    merchantOrderId: string,
    apiKey: string,
    receivedSignature: string
  ): boolean {
    const plainText = `${merchantCode}${amount}${merchantOrderId}${apiKey}`;
    const calculatedSignature = CryptoJS.MD5(plainText).toString();
    return calculatedSignature === receivedSignature;
  }

  // Get available payment methods
  static async getPaymentMethods(
    amount: number
  ): Promise<DuitkuPaymentMethodsResponse> {
    const datetime = this.getCurrentDateTime();
    const signature = this.generatePaymentMethodSignature(
      DUITKU_CONFIG.MERCHANT_CODE,
      amount,
      datetime,
      DUITKU_CONFIG.API_KEY
    );

    const requestData = {
      merchantcode: DUITKU_CONFIG.MERCHANT_CODE,
      amount: amount.toString(),
      datetime: datetime,
      signature: signature,
    };

    const apiUrl = `${this.getBaseUrl()}${
      DUITKU_ENDPOINTS.GET_PAYMENT_METHODS
    }`;

    console.log("🔍 Duitku Payment Methods Request:");
    console.log("- API URL:", apiUrl);
    console.log(
      "- Environment:",
      DUITKU_CONFIG.IS_PRODUCTION ? "PRODUCTION" : "SANDBOX"
    );
    console.log("- Merchant Code:", DUITKU_CONFIG.MERCHANT_CODE);
    console.log("- Amount:", amount);
    console.log("- DateTime:", datetime);
    console.log("- Signature:", signature);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log(
        "🔍 Duitku Response Status:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Duitku Error Response:", errorText);
        throw new Error(
          `Failed to get payment methods: ${response.statusText} - ${errorText}`
        );
      }

      const responseData = await response.json();
      console.log(
        "✅ Duitku Response Data:",
        JSON.stringify(responseData, null, 2)
      );

      return responseData;
    } catch (error) {
      console.error("❌ Duitku API Error:", error);
      console.error("Request details:", {
        url: apiUrl,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData, null, 2),
      });
      throw error;
    }
  }

  // Create transaction
  static async createTransaction(
    transactionData: Omit<
      DuitkuTransactionRequest,
      "merchantCode" | "signature"
    >
  ): Promise<DuitkuTransactionResponse> {
    const signature = this.generateTransactionSignature(
      DUITKU_CONFIG.MERCHANT_CODE,
      transactionData.merchantOrderId,
      transactionData.paymentAmount,
      DUITKU_CONFIG.API_KEY
    );

    // Ensure all required fields are present and properly formatted
    const requestData: DuitkuTransactionRequest = {
      merchantCode: DUITKU_CONFIG.MERCHANT_CODE,
      paymentAmount: transactionData.paymentAmount,
      paymentMethod: transactionData.paymentMethod,
      merchantOrderId: transactionData.merchantOrderId,
      productDetails: transactionData.productDetails,
      additionalParam: transactionData.additionalParam || "",
      merchantUserInfo: transactionData.merchantUserInfo || "",
      customerVaName: transactionData.customerVaName,
      email: transactionData.email,
      phoneNumber: transactionData.phoneNumber || "",
      itemDetails: transactionData.itemDetails || [],
      customerDetail: transactionData.customerDetail,
      callbackUrl: transactionData.callbackUrl,
      returnUrl: transactionData.returnUrl,
      signature: signature,
      expiryPeriod: transactionData.expiryPeriod || 60,
    };

    console.log(
      "🔍 Duitku Transaction Request:",
      JSON.stringify(requestData, null, 2)
    );

    const response = await fetch(
      `${this.getBaseUrl()}${DUITKU_ENDPOINTS.CREATE_TRANSACTION}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    console.log(
      "🔍 Duitku Response Status:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Duitku Error Response:", errorText);
      throw new Error(
        `Failed to create transaction: ${response.statusText} - ${errorText}`
      );
    }

    const responseData = await response.json();
    console.log(
      "✅ Duitku Response Data:",
      JSON.stringify(responseData, null, 2)
    );

    return responseData;
  }

  // Check transaction status
  static async checkTransactionStatus(
    merchantOrderId: string
  ): Promise<DuitkuTransactionStatusResponse> {
    const signature = this.generateStatusSignature(
      DUITKU_CONFIG.MERCHANT_CODE,
      merchantOrderId,
      DUITKU_CONFIG.API_KEY
    );

    const requestData: DuitkuTransactionStatusRequest = {
      merchantCode: DUITKU_CONFIG.MERCHANT_CODE,
      merchantOrderId: merchantOrderId,
      signature: signature,
    };

    const response = await fetch(
      `${this.getBaseUrl()}${DUITKU_ENDPOINTS.CHECK_TRANSACTION}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to check transaction status: ${response.statusText}`
      );
    }

    return response.json();
  }

  // Generate unique order ID
  static generateOrderId(prefix: string = "LMS"): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  // Format currency to IDR
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  // Get payment method display name
  static getPaymentMethodName(paymentCode: string): string {
    const paymentMethods: Record<string, string> = {
      VA: "Maybank Virtual Account",
      BT: "Permata Bank Virtual Account",
      VC: "Credit Card",
      BC: "BCA Virtual Account",
      M2: "Mandiri Virtual Account",
      BN: "BNI Virtual Account",
      BR: "BRIVA",
      SP: "ShopeePay",
      OV: "OVO",
      DA: "DANA",
      DQ: "Dana",
      LF: "LinkAja",
      LA: "LinkAja",
      NQ: "Nobu QRIS",
      OL: "OVO Link",
      JP: "Jenius Pay",
      GQ: "Gudang Voucher QRIS",
      GP: "GoPay",
      A1: "ATM Bersama",
      AG: "Bank Artha Graha",
      AM: "Alfamart",
      I1: "BNI Virtual Account",
      FT: "Pegadaian/ALFA/Pos",
      SA: "Shopee Pay Apps",
      DN: "Indodana Paylater",
      S1: "Bank Sahabat Sampoerna",
      B1: "CIMB Niaga Virtual Account",
      DM: "Danamon Virtual Account",
      MD: "Mandiri Clickpay",
      SL: "ShopeePay Account Link",
      LQ: "LinkAja QRIS",
      B2: "Permata Net",
      AT: "ATOME Paylater",
      B3: "BCA KlikBCA",
      BV: "BSI Virtual Account",
      B4: "BNI Internet Banking",
      B5: "BRI Internet Banking",
      U1: "UOB Personal Internet Banking",
      FD: "BSI Mobile",
      O1: "OCBC ONe Mobile",
      MV: "Maybank Virtual Account",
      IR: "Indomaret",
      QR: "QRIS",
      NC: "Bank Neo Commerce/BNC",
    };

    return paymentMethods[paymentCode] || paymentCode;
  }

  // Validate payment amount
  static validateAmount(amount: number): boolean {
    return amount >= 1000 && amount <= 50000000; // IDR 1,000 to IDR 50,000,000
  }

  // Get callback URL
  static getCallbackUrl(): string {
    const baseUrl = "https://f287c11984de.ngrok-free.app/";
    return `${baseUrl}/api/webhook/duitku`;
  }

  // Get return URL
  static getReturnUrl(courseId?: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return courseId
      ? `${baseUrl}/payment/success?courseId=${courseId}`
      : `${baseUrl}/payment/success`;
  }
}

export default DuitkuHelper;
