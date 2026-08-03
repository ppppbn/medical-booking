import crypto from 'crypto';

export interface VNPayPaymentData {
  amount: number; // in VND
  orderId: string; // paymentId or appointmentId
  orderInfo: string; // payment description
  ipAddr: string;
  returnUrl?: string;
}

export class VNPayService {
  private tmnCode: string;
  private secretKey: string;
  private vnpUrl: string;
  private returnUrl: string;

  constructor() {
    this.tmnCode = process.env.VNP_TMNCODE || 'VNPAY_DEMO';
    this.secretKey = process.env.VNP_HASHSECRET || 'VNPAY_SECRET_KEY';
    this.vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.returnUrl = process.env.VNP_RETURNURL || 'http://localhost:3000/payment/vnpay-return';
  }

  private sortObject(obj: Record<string, any>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const str: string[] = [];

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();

    for (let i = 0; i < str.length; i++) {
      sorted[str[i]] = encodeURIComponent(obj[str[i]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  private formatVNPayDate(date: Date): string {
    const yyyy = date.getFullYear().toString();
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const hh = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    const ss = date.getSeconds().toString().padStart(2, '0');
    return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
  }

  createPaymentUrl(data: VNPayPaymentData): string {
    const date = new Date();
    const createDate = this.formatVNPayDate(date);
    
    // Expire date after 15 minutes
    const expireDateObj = new Date(date.getTime() + 15 * 60 * 1000);
    const expireDate = this.formatVNPayDate(expireDateObj);

    let vnpParams: Record<string, any> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: data.orderId,
      vnp_OrderInfo: data.orderInfo || `Thanh toan phi kham benh cho don hang ${data.orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: Math.round(data.amount * 100), // VNPay requires amount * 100
      vnp_ReturnUrl: data.returnUrl || this.returnUrl,
      vnp_IpAddr: data.ipAddr || '127.0.0.1',
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate
    };

    const sortedParams = this.sortObject(vnpParams);

    // Build sign data string
    const signDataParts: string[] = [];
    const queryParts: string[] = [];

    for (const key in sortedParams) {
      if (Object.prototype.hasOwnProperty.call(sortedParams, key)) {
        signDataParts.push(`${key}=${sortedParams[key]}`);
        queryParts.push(`${key}=${sortedParams[key]}`);
      }
    }

    const signData = signDataParts.join('&');
    const hmac = crypto.createHmac('sha512', this.secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    queryParts.push(`vnp_SecureHash=${signed}`);

    return `${this.vnpUrl}?${queryParts.join('&')}`;
  }

  verifyReturnUrl(vnpParams: Record<string, any>): { isValid: boolean; isSuccess: boolean; responseCode: string; txnRef: string; amount: number } {
    const secureHash = vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    const sortedParams = this.sortObject(vnpParams);

    const signDataParts: string[] = [];
    for (const key in sortedParams) {
      if (Object.prototype.hasOwnProperty.call(sortedParams, key)) {
        signDataParts.push(`${key}=${sortedParams[key]}`);
      }
    }

    const signData = signDataParts.join('&');
    const hmac = crypto.createHmac('sha512', this.secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const isValid = secureHash ? secureHash.toLowerCase() === signed.toLowerCase() : false;
    const responseCode = vnpParams['vnp_ResponseCode'] || '';
    const transactionStatus = vnpParams['vnp_TransactionStatus'] || '';
    const isSuccess = isValid && responseCode === '00' && transactionStatus === '00';
    const txnRef = vnpParams['vnp_TxnRef'] || '';
    const amount = vnpParams['vnp_Amount'] ? Number(vnpParams['vnp_Amount']) / 100 : 0;

    return {
      isValid,
      isSuccess,
      responseCode,
      txnRef,
      amount
    };
  }
}
