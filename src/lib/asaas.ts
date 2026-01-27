export interface AsaasCustomer {
  id: string;
  name: string;
  email?: string;
  cpfCnpj?: string;
  phone?: string;
}

export interface AsaasPixCharge {
  id: string;
  status: string;
  invoiceUrl: string;
  value: number;
  netValue: number;
  description?: string;
  billingType: string;
  dueDate: string;
}

export interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

export async function createAsaasCustomer(data: {
  name: string;
  cpfCnpj: string;
  phone?: string;
  email?: string;
}): Promise<AsaasCustomer> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY is not configured');
  }

  // Primeiro tenta buscar o cliente pelo CPF/CNPJ
  const searchResponse = await fetch(
    `${ASAAS_API_URL}/customers?cpfCnpj=${data.cpfCnpj}`,
    {
      method: 'GET',
      headers: {
        access_token: ASAAS_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!searchResponse.ok) {
    throw new Error('Failed to search customer in Asaas');
  }

  const searchData = await searchResponse.json();

  if (searchData.data && searchData.data.length > 0) {
    const existingCustomer = searchData.data[0];

    // Atualizar o cliente existente com os dados mais recentes
    try {
      const updateResponse = await fetch(
        `${ASAAS_API_URL}/customers/${existingCustomer.id}`,
        {
          method: 'POST',
          headers: {
            access_token: ASAAS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name,
            mobilePhone: data.phone,
            email: data.email,
          }),
        }
      );

      if (updateResponse.ok) {
        return updateResponse.json();
      } else {
        console.warn(
          'Failed to update existing Asaas customer:',
          await updateResponse.text()
        );
      }
    } catch (error) {
      console.error('Error updating Asaas customer:', error);
    }

    return existingCustomer;
  }

  // Se não encontrar, cria um novo
  const createResponse = await fetch(`${ASAAS_API_URL}/customers`, {
    method: 'POST',
    headers: {
      access_token: ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      cpfCnpj: data.cpfCnpj,
      mobilePhone: data.phone,
      email: data.email,
    }),
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json();
    throw new Error(
      `Failed to create customer in Asaas: ${JSON.stringify(errorData)}`
    );
  }

  return createResponse.json();
}

export async function createPixCharge(data: {
  customer: string;
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}): Promise<AsaasPixCharge> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY is not configured');
  }

  const response = await fetch(`${ASAAS_API_URL}/payments`, {
    method: 'POST',
    headers: {
      access_token: ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer: data.customer,
      billingType: 'PIX',
      value: data.value,
      dueDate: data.dueDate,
      description: data.description,
      externalReference: data.externalReference,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to create Pix charge in Asaas: ${JSON.stringify(errorData)}`
    );
  }

  return response.json();
}

export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY is not configured');
  }

  const response = await fetch(
    `${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`,
    {
      method: 'GET',
      headers: {
        access_token: ASAAS_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to get Pix QR Code: ${JSON.stringify(errorData)}`
    );
  }

  return response.json();
}
