import * as Print from 'expo-print';

export const generateOrderPdf = async (orderDetails, assignedServices) => {
    // Рассчитываем итоговую сумму услуг
    const totalSum = assignedServices.reduce((sum, service) => sum + service.price, 0);

    const htmlContent = `
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; }
                    h1 { text-align: center; font-size: 28px; margin-bottom: 20px; }
                    .header-section, .signature-section {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 20px;
                    }
                    .header-section div, .signature-section div {
                        width: 48%;
                    }
                    .header-section th, .header-section td, 
                    .order-details th, .order-details td, 
                    .services-table th, .services-table td {
                        padding: 8px;
                        border: 1px solid #000;
                        text-align: left;
                        font-size: 14px;
                    }
                    .header-section table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .car-schema img {
                        width: 100%;
                        padding: 10px;
                    }
                    .order-details, .services-table {
                        margin-top: 20px;
                        border-collapse: collapse;
                        width: 100%;
                    }
                    .order-details th, .services-table th {
                        background-color: #f2f2f2;
                    }
                    .services-table {
                        margin-top: 20px;
                    }
                    .signature-section p {
                        font-size: 18px;
                        margin-bottom: 5px;
                    }
                    .signature-line {
                        border-bottom: 1px solid #000;
                        width: 100%;
                        height: 30px;
                    }
                    @media print {
                        .page-break { page-break-before: always; }
                    }
                </style>
            </head>
            <body>
                <h1>АКТ СДАЧИ-ПРИЕМКИ АВТОМОБИЛЯ В РЕМОНТ</h1>

                <div class="signature-section">
                    <div>
                        <p>ФИО клиента:</p>
                        <div class="signature-line"></div>
                    </div>
                    <div>
                        <p>Подпись клиента:</p>
                        <div class="signature-line"></div>
                    </div>
                </div>

                <div class="header-section">
                    <div>
                        <table>
                            <tr>
                                <th>Название организации:</th>
                                <td>${orderDetails?.organization?.fullName}</td>
                            </tr>
                            <tr>
                                <th>ИНН:</th>
                                <td>${orderDetails?.organization?.number}</td>
                            </tr>
                            <tr>
                                <th>Дата создания организации:</th>
                                <td>${new Date(orderDetails?.organization?.dateOfCreated).toLocaleDateString()}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="car-schema">
                        <img src="https://autotonkosti.ru/sites/default/files/inline/images/2018-06-13_004856.jpg" alt="Схема машины" />
                    </div>
                </div>

                <table class="order-details">
                    <tr>
                        <th>Гос. номер:</th>
                        <td>${orderDetails?.carNumber}</td>
                    </tr>
                    <tr>
                        <th>Марка и модель:</th>
                        <td>${orderDetails?.car?.name} ${orderDetails?.modelCar?.name}</td>
                    </tr>
                    <tr>
                        <th>Клиент:</th>
                        <td>${orderDetails?.clientFullName}</td>
                    </tr>
                    <tr>
                        <th>Телефон:</th>
                        <td>${orderDetails?.phoneNumber}</td>
                    </tr>
                    <tr>
                        <th>Принял:</th>
                        <td>${orderDetails?.aspNetUser?.userName || 'Неизвестно'}</td> <!-- ФИО приемщика -->
                    </tr>
                    <tr>
                        <th>Дата приема:</th>
                        <td>${new Date(orderDetails?.dateOfCreated).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                        <th>Комментарий:</th>
                        <td>${orderDetails?.comment || 'Нет комментариев'}</td>
                    </tr>
                </table>

                <div class="page-break"></div> <!-- Разделитель страниц для длинного списка услуг -->

                <h2>Перечень выполняемых услуг</h2>
                <table class="services-table">
                    <tr>
                        <th>Услуга</th>
                        <th>Цена</th>
                    </tr>
                    ${assignedServices.map(service => `
                        <tr>
                            <td>${service.serviceName}</td>
                            <td>${service.price} тенге</td>
                        </tr>
                    `).join('')}
                    <!-- Добавляем итоговую сумму -->
                    <tr>
                        <th>Итого:</th>
                        <th>${totalSum} тенге</th>
                    </tr>
                </table>
            </body>
        </html>
    `;

    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    console.log('PDF создан:', uri);
    return uri;
};
