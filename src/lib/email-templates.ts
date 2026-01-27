
interface PaymentConfirmationData {
  responsibleName: string;
  teamName: string;
  championshipName: string;
  amount: number;
  paymentDate: Date;
  invoiceUrl?: string | null;
}

export function generatePaymentConfirmationEmail(data: PaymentConfirmationData): string {
  const formattedDate = data.paymentDate.toLocaleDateString('pt-BR');
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(data.amount);

  // Template baseado no billing-email.ts mas adaptado para confirmação
  return `
<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="pt-BR">

<head>
	<title>Confirmação de Pagamento</title>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link href="https://fonts.googleapis.com/css2?family=Lato:wght@100;200;300;400;500;600;700;800;900" rel="stylesheet" type="text/css">
	<style>
		* { box-sizing: border-box; }
		body { margin: 0; padding: 0; }
		a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
		#MessageViewBody a { color: inherit; text-decoration: none; }
		p { line-height: inherit }
		@media (max-width:660px) {
			.icons-inner { text-align: center; }
			.icons-inner td { margin: 0 auto; }
			.row-content { width: 100% !important; }
			.stack .column { width: 100%; display: block; }
		}
	</style>
</head>

<body class="body" style="background-color: #FFFFFF; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
	<table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #FFFFFF;">
		<tbody>
			<tr>
				<td>
					<table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color: #000000; width: 640px; margin: 0 auto;" width="640">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="font-weight: 400; text-align: left; padding-bottom: 20px; padding-top: 20px; vertical-align: top;">
													<div style="font-family: 'Lato', sans-serif; font-size: 24px; font-weight: 700; color: #0c2b5b; text-align: center;">
                            AFDB Campeonatos
                          </div>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
					<table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #dbeafe; color: #000000; width: 640px; margin: 0 auto;" width="640">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="font-weight: 400; text-align: left; padding-bottom: 60px; padding-top: 60px; vertical-align: top;">
													<table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
														<tr>
															<td class="pad" style="width:100%;">
																<div class="alignment" align="center">
                                  <!-- Checkmark Icon -->
																	<div style="max-width: 100px; background: white; border-radius: 50%; padding: 20px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="#22c55e" style="width: 60px; height: 60px;">
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                  </div>
																</div>
															</td>
														</tr>
													</table>
													<table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
														<tr>
															<td class="pad" style="padding-left:10px;padding-right:10px;padding-top:30px;">
																<div style="color:#0c2b5b;font-family:'Lato', Tahoma, Verdana, Segoe, sans-serif;font-size:48px;line-height:1.2;text-align:center;">
																	<p style="margin: 0;"><strong>Olá, ${data.responsibleName}</strong></p>
																</div>
															</td>
														</tr>
													</table>
													<table class="paragraph_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
														<tr>
															<td class="pad" style="padding-bottom:10px;padding-left:10px;padding-right:10px;">
																<div style="color:#0c2b5b;font-family:'Lato', Tahoma, Verdana, Segoe, sans-serif;font-size:24px;line-height:1.2;text-align:center;">
																	<p style="margin: 0;"><strong>Pagamento Confirmado!</strong></p>
                                  <p style="margin: 0; font-size: 18px; margin-top: 10px;">A inscrição do time <strong>${data.teamName}</strong> foi aprovada.</p>
																</div>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>

          <!-- Detalhes -->
					<table class="row row-4" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #eff6ff; color: #000000; width: 640px; margin: 0 auto;" width="640">
										<tbody>
											<tr>
												<td class="column column-1" width="33.33%" style="padding: 20px; text-align: center;">
													<div style="font-family:'Lato', sans-serif; font-size:14px; color: #555;">Campeonato</div>
                          <div style="font-family:'Lato', sans-serif; font-size:16px; font-weight: bold; color: #000;">${data.championshipName}</div>
												</td>
												<td class="column column-2" width="33.33%" style="padding: 20px; text-align: center;">
													<div style="font-family:'Lato', sans-serif; font-size:14px; color: #555;">Data</div>
                          <div style="font-family:'Lato', sans-serif; font-size:16px; font-weight: bold; color: #000;">${formattedDate}</div>
												</td>
												<td class="column column-3" width="33.33%" style="padding: 20px; text-align: center;">
													<div style="font-family:'Lato', sans-serif; font-size:14px; color: #555;">Valor</div>
                          <div style="font-family:'Lato', sans-serif; font-size:16px; font-weight: bold; color: #000;">${formattedAmount}</div>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>

          ${data.invoiceUrl ? `
          <table class="row row-12" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; color: #000000; width: 640px; margin: 0 auto;" width="640">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="text-align: center; padding: 40px;">
													<a href="${data.invoiceUrl}" target="_blank" style="background-color: #1e3a8a; color: #ffffff; display: inline-block; font-family: 'Lato', sans-serif; font-size: 18px; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            VER COMPROVANTE
                          </a>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
          ` : ''}

					<table class="row row-13" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color: #000000; width: 640px; margin: 0 auto;" width="640">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="font-weight: 400; text-align: center; padding-bottom: 30px; padding-top: 30px;">
													<div style="color:#555555;font-family:'Lato', sans-serif;font-size:14px;line-height:1.5;">
														<p style="margin: 0;">Você está recebendo este e-mail porque cadastrou um time no AFDB Campeonatos.</p>
													</div>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
				</td>
			</tr>
		</tbody>
	</table>
</body>
</html>
  `;
}
