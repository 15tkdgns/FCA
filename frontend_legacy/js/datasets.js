document.addEventListener('DOMContentLoaded', () => {
    const datasetsInfo = [
        {
            name: "Credit Card Fraud Detection Dataset 2023 (nelgiriyewithana)",
            shortName: "Credit Card Fraud 2023",
            description: "A synthetic dataset for credit card fraud detection, perfectly balanced with equal numbers of fraudulent and non-fraudulent transactions. Preprocessed to remove duplicates and ID column.",
            originalUrl: "https://www.kaggle.com/datasets/nelgiriyewithana/credit-card-fraud-detection-dataset-2023",
            downloadedPath: "/root/FCA/data/credit_card_fraud_2023/creditcard_2023_processed.csv",
            steps: ["DP010", "DP011", "DP012", "DP014"],
            apiName: "credit_card_fraud_2023",
            features: {
                "Anonymized Features": ["V1-V28 (28 PCA-transformed features)"],
                "Transaction": ["Amount ($50.01 - $24,039.93)"],
                "Target": ["Class (0=Normal, 1=Fraud)"]
            },
            rowCount: "568,629 transactions (after preprocessing)",
            fraudRate: "Perfectly balanced (50% each class)",
            preprocessingNotes: "Removed 1 duplicate, dropped 'id' column, validated class balance"
        },
        {
            name: "HuggingFace CIS435-CreditCardFraudDetection",
            shortName: "HF Credit Card Fraud",
            description: "A credit card fraud detection dataset from HuggingFace with real-world transaction data. Preprocessed to remove unnamed columns and duplicates.",
            originalUrl: "hf://datasets/dazzle-nu/CIS435-CreditCardFraudDetection",
            downloadedPath: "/root/FCA/data/hf_creditcard_fraud/hf_creditcard_processed.csv",
            steps: ["DP013", "DP016"],
            apiName: "hf_creditcardfraud",
            features: {
                "Demographics": ["gender, first, last, street, city, state, zip, job, dob"],
                "Transaction": ["trans_date_trans_time, cc_num, merchant, category, amt, trans_num, unix_time"],
                "Geographic": ["lat, long, city_pop, merch_lat, merch_long"],
                "Target": ["is_fraud (0=Normal, 1=Fraud)"]
            },
            rowCount: "1,048,575 transactions (processed)",
            fraudRate: "Highly imbalanced (0.6% fraud)",
            preprocessingNotes: "Removed unnamed columns, no duplicates found"
        },
        {
            name: "Financial Phrasebank Dataset",
            shortName: "Financial Phrasebank",
            description: "A dataset for financial sentiment analysis with labeled sentences from financial news. Processed both CSV and text formats with encoding fixes.",
            originalUrl: "Various sources (Kaggle: ankurzing/sentiment-analysis-for-financial-news)",
            downloadedPath: "/root/FCA/data/financial_phrasebank/financial_sentences_processed.csv",
            steps: ["DP015", "DP017"],
            apiName: "financial_phrasebank",
            features: {
                "Text": ["sentence (financial news sentences)"],
                "Labels": ["sentiment (positive, negative, neutral)"],
                "Metadata": ["agreement_level (50Agree, 66Agree, 75Agree, AllAgree)"]
            },
            rowCount: "14,780 sentences (processed)",
            fraudRate: "Sentiment: 60.5% neutral, 27.0% positive, 12.5% negative",
            preprocessingNotes: "Fixed encoding issues, processed text files, combined agreement levels"
        },
        {
            name: "IBM Transactions for Anti-Money Laundering (AML)",
            shortName: "IBM AML",
            description: "A synthetic dataset of financial transactions designed for AML solutions. Download failed due to large file size and infrastructure limitations.",
            originalUrl: "https://www.kaggle.com/datasets/ealtman2019/ibm-transactions-for-anti-money-laundering-aml",
            downloadedPath: "/root/FCA/data/ibm_aml/ (download failed)",
            steps: ["DP015", "DP022"],
            apiName: "ibm_aml",
            features: {
                "Status": ["Download failed - timeout errors"],
                "Expected Features": ["Timestamp, From Account, To Account, Amount, Receiving Currency, Payment Currency, Payment Format, Is Laundering"]
            },
            rowCount: "0 records (download failed)",
            fraudRate: "N/A (download failed)",
            preprocessingNotes: "Multiple download attempts failed due to timeouts"
        },
        {
            name: "Credit Card Fraud Detection by teamincribo",
            shortName: "Incribo Fraud",
            description: "A comprehensive transaction fraud dataset with detailed merchant, location, and device information. Perfectly balanced dataset with missing values.",
            originalUrl: "https://www.kaggle.com/datasets/teamincribo/credit-card-fraud",
            downloadedPath: "/root/FCA/data/incribo_fraud/incribo_fraud_processed.csv",
            steps: ["DP021"],
            apiName: "incribo_fraud",
            features: {
                "Transaction": ["Transaction Date/Time, Amount, Currency, Response Code, Transaction ID"],
                "Merchant": ["Merchant Name, Category Code (MCC), Location"],
                "Payment": ["Card Type, Card Number (Hashed), CVV (Hashed), Expiration Date"],
                "Security": ["IP Address, Device Information, User Account Info"],
                "Target": ["Fraud Flag or Label (0=Normal, 1=Fraud)"]
            },
            rowCount: "8,000 transactions",
            fraudRate: "Perfectly balanced (49.9% fraud)",
            preprocessingNotes: "No duplicates, 6,053 missing values identified"
        },
        {
            name: "Fraud Detection by whenamancodes",
            shortName: "WAMC Fraud",
            description: "A classic fraud detection dataset with PCA-transformed anonymized features. Preprocessed to remove duplicates.",
            originalUrl: "https://www.kaggle.com/datasets/whenamancodes/fraud-detection",
            downloadedPath: "/root/FCA/data/wamc_fraud/wamc_fraud_processed.csv",
            steps: ["DP019"],
            apiName: "wamc_fraud",
            features: {
                "Time Features": ["Time (seconds elapsed)"],
                "Anonymized": ["V1-V28 (PCA transformed features)"],
                "Transaction": ["Amount"],
                "Target": ["Class (0=Normal, 1=Fraud)"]
            },
            rowCount: "283,726 transactions (after deduplication)",
            fraudRate: "Highly imbalanced (0.17% fraud)",
            preprocessingNotes: "Removed 1,081 duplicates, classic benchmark dataset"
        },
        {
            name: "Predicting Credit Card Customer Attrition",
            shortName: "Customer Attrition",
            description: "A comprehensive dataset for predicting credit card customer churn with demographic, behavioral, and transaction features. No preprocessing needed.",
            originalUrl: "https://www.kaggle.com/datasets/thedevastator/predicting-credit-card-customer-attrition-with-m",
            downloadedPath: "/root/FCA/data/customer_attrition/customer_attrition_processed.csv",
            steps: ["DP020"],
            apiName: "customer_attrition",
            features: {
                "Customer": ["CLIENTNUM, Customer_Age, Gender, Dependent_count, Education_Level"],
                "Financial": ["Income_Category, Card_Category, Credit_Limit, Total_Revolving_Bal"],
                "Behavioral": ["Months_on_book, Total_Relationship_Count, Months_Inactive_12_mon, Contacts_Count_12_mon"],
                "Transaction": ["Total_Trans_Amt, Total_Trans_Ct, Avg_Utilization_Ratio"],
                "Target": ["Attrition_Flag (Existing/Attrited Customer)"]
            },
            rowCount: "10,127 customers",
            fraudRate: "16.1% attrition rate",
            preprocessingNotes: "No duplicates found, clean dataset ready for modeling"
        },
        {
            name: "Credit Card Fraud by dhanushnarayananr",
            shortName: "Dhanush Fraud",
            description: "A behavioral fraud detection dataset with distance metrics and transaction patterns. Features real-world behavioral indicators.",
            originalUrl: "https://www.kaggle.com/datasets/dhanushnarayananr/credit-card-fraud",
            downloadedPath: "/root/FCA/data/dhanush_fraud/dhanush_fraud_processed.csv",
            steps: ["DP018"],
            apiName: "dhanush_fraud",
            features: {
                "Behavioral": ["distance_from_home, distance_from_last_transaction, ratio_to_median_purchase_price"],
                "Transaction": ["repeat_retailer, used_chip, used_pin_number, online_order"],
                "Target": ["fraud (0=Normal, 1=Fraud)"]
            },
            rowCount: "1,000,000 transactions",
            fraudRate: "Moderately imbalanced (8.7% fraud)",
            preprocessingNotes: "No duplicates found, unique behavioral features for fraud detection"
        }
    ];

    fetch('/work_flow.xml')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(xmlText => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");
            const tableBody = document.querySelector('#datasetTable tbody');
            const loadingMessage = document.getElementById('loadingMessage');
            loadingMessage.style.display = 'none';

            const stepDescriptions = {};
            const steps = xmlDoc.querySelectorAll('Step');
            steps.forEach(step => {
                const id = step.getAttribute('id');
                const description = step.querySelector('Description');
                if (id && description) {
                    stepDescriptions[id] = description.textContent;
                }
            });

            datasetsInfo.forEach(dataset => {
                const row = tableBody.insertRow();

                // Dataset column (compact)
                const datasetCell = row.insertCell();
                datasetCell.innerHTML = `
                    <div class="dataset-info">
                        <div class="dataset-name">${dataset.shortName}</div>
                        <div class="dataset-meta">${dataset.rowCount || 'Unknown size'}</div>
                        ${dataset.timeRange ? `<div class="dataset-meta">${dataset.timeRange}</div>` : ''}
                        ${dataset.fraudRate ? `<div class="dataset-meta">${dataset.fraudRate}</div>` : ''}
                        ${dataset.preprocessingNotes ? `<div class="dataset-meta" style="color: #28a745; font-style: italic;">✓ ${dataset.preprocessingNotes}</div>` : ''}
                    </div>
                `;

                // Description column (larger)
                const descCell = row.insertCell();
                descCell.textContent = dataset.description;

                // Processing Steps column (main focus - largest)
                const processingCell = row.insertCell();
                const ul = document.createElement('ul');
                ul.className = 'step-list';
                dataset.steps.forEach(stepId => {
                    const li = document.createElement('li');
                    li.textContent = stepDescriptions[stepId] || `Description for ${stepId} not found.`;
                    ul.appendChild(li);
                });
                processingCell.appendChild(ul);

                // Dataset Features column
                const featuresCell = row.insertCell();
                let featuresHtml = '';
                for (const [category, features] of Object.entries(dataset.features)) {
                    featuresHtml += `<div class="feature-category">${category}:</div>`;
                    featuresHtml += `<ul class="features-list">`;
                    features.forEach(feature => {
                        featuresHtml += `<li>${feature}</li>`;
                    });
                    featuresHtml += `</ul>`;
                }
                featuresCell.innerHTML = featuresHtml;

                // Actions column (buttons)
                const actionsCell = row.insertCell();
                actionsCell.innerHTML = `
                    <div class="action-buttons">
                        <button class="action-btn primary" onclick="openHeadModal('${dataset.apiName}')">View Head</button>
                        <a class="action-btn" href="${dataset.originalUrl}" target="_blank">Source</a>
                        <button class="action-btn" onclick="showDatasetPath('${dataset.downloadedPath}')">Path Info</button>
                    </div>
                `;
            });
        })
        .catch(error => {
            console.error('Error fetching or parsing XML:', error);
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('errorMessage').textContent = 'Failed to load or parse workflow.xml. Please ensure the file exists and the server is running correctly.';
        });

    const headModal = document.getElementById('headModal');
    const headModalContent = document.getElementById('headModalContent');
    const closeModal = document.querySelector('.close-button');

    closeModal.onclick = () => {
        headModal.style.display = 'none';
        headModalContent.innerHTML = ''; // Clear content when closing
    };

    window.onclick = (event) => {
        if (event.target == headModal) {
            headModal.style.display = 'none';
            headModalContent.innerHTML = '';
        }
    };

    async function openHeadModal(apiName) {
        headModal.style.display = 'block';
        headModalContent.innerHTML = '<div class="loading-spinner"></div>Loading dataset preview...';

        try {
            const response = await fetch(`/get_dataset_head/${apiName}`);
            const htmlContent = await response.text();
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            headModalContent.innerHTML = htmlContent;
        } catch (error) {
            console.error(`Error fetching head for ${apiName}:`, error);
            headModalContent.innerHTML = `
                <div class="error">
                    <h4>Failed to Load Dataset</h4>
                    <p><strong>Dataset:</strong> ${apiName}</p>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p>Please check if the server is running and the dataset file exists.</p>
                </div>
            `;
        }
    }

    // Make functions global so they can be called from inline onclick
    window.openHeadModal = openHeadModal;
    
    window.showDatasetPath = function(path) {
        // Create a more informative modal for path info
        const pathInfo = `
            <div style="padding: 20px;">
                <h4>Dataset File Information</h4>
                <p><strong>Full Path:</strong></p>
                <code style="background-color: #f8f9fa; padding: 10px; display: block; border-radius: 4px; font-family: monospace;">
                    ${path}
                </code>
                <br>
                <p><strong>Directory:</strong> ${path.substring(0, path.lastIndexOf('/'))}</p>
                <p><strong>Filename:</strong> ${path.substring(path.lastIndexOf('/') + 1)}</p>
                ${path.includes('processed') ? '<p style="color: #28a745;"><strong>✓ This is a processed dataset file</strong></p>' : ''}
                ${path.includes('empty') || path.includes('failed') ? '<p style="color: #dc3545;"><strong>⚠ Dataset not available</strong></p>' : ''}
            </div>
        `;
        
        headModalContent.innerHTML = pathInfo;
        headModal.style.display = 'block';
    };
});