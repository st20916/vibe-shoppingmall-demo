const PORTONE_TOKEN_URL = 'https://api.iamport.kr/users/getToken';
const PORTONE_PAYMENT_URL = 'https://api.iamport.kr/payments';

const getPortoneCredentials = () => {
  const impKey = process.env.PORTONE_API_KEY;
  const impSecret = process.env.PORTONE_API_SECRET;

  if (!impKey || !impSecret) {
    const error = new Error(
      'PORTONE_API_KEY or PORTONE_API_SECRET is not defined in environment variables'
    );
    error.statusCode = 500;
    throw error;
  }

  return { impKey, impSecret };
};

const getPortoneAccessToken = async () => {
  const { impKey, impSecret } = getPortoneCredentials();

  const response = await fetch(PORTONE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imp_key: impKey,
      imp_secret: impSecret,
    }),
  });

  const result = await response.json();

  if (!response.ok || result.code !== 0 || !result.response?.access_token) {
    const error = new Error(result.message || 'Failed to get PortOne access token');
    error.statusCode = 502;
    throw error;
  }

  return result.response.access_token;
};

const getPortonePayment = async (impUid) => {
  const accessToken = await getPortoneAccessToken();

  const response = await fetch(
    `${PORTONE_PAYMENT_URL}/${encodeURIComponent(impUid)}?include_sandbox=true`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const result = await response.json();

  if (!response.ok || result.code !== 0 || !result.response) {
    const error = new Error(result.message || 'Failed to get PortOne payment');
    error.statusCode = 502;
    throw error;
  }

  return result.response;
};

/**
 * 포트원 결제 내역 검증
 * - status === paid
 * - amount === expectedAmount
 * - merchant_uid 일치 (전달된 경우)
 */
const verifyPortonePayment = async ({ impUid, merchantUid, expectedAmount }) => {
  const payment = await getPortonePayment(impUid);

  if (payment.status !== 'paid') {
    const error = new Error(`Payment is not paid (status: ${payment.status})`);
    error.statusCode = 400;
    throw error;
  }

  if (Number(payment.amount) !== Number(expectedAmount)) {
    const error = new Error('Payment amount mismatch');
    error.statusCode = 400;
    throw error;
  }

  if (merchantUid && payment.merchant_uid && payment.merchant_uid !== merchantUid) {
    const error = new Error('Payment merchant_uid mismatch');
    error.statusCode = 400;
    throw error;
  }

  return payment;
};

module.exports = {
  getPortoneAccessToken,
  getPortonePayment,
  verifyPortonePayment,
};
