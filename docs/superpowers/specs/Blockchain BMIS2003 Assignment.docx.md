

# **FACULTY OF COMPUTING AND INFORMATION TECHNOLOGY**

![][image1]  
**BMIS2003 Blockchain Application Development**

**Assignment**  
**Academic Session: 202601**  
**Programme: RSDY3S2**  
**Tutorial Group: Group 1**

**Team Members:**

| No | Student Name & Photo | Student ID | Signature  |
| :---- | :---- | :---- | ----- |
| **1** | **LIM JIA YING**  | **23PMR15622**  |   ![][image2] |
| **2** | **CHANEL OOI ANN JOA**  | **23PMR14885**  | ![][image3]  |
| **3** | **CHENG WINKY**  | **23PMR14886** |   ![][image4]  |
| **4** | **DANIEL YEE KHENG TAN ![][image5]** | **23PMR13767** | ![][image6] |
| **5**   | **FONG WEN YI ![][image7]** | **23PMR15599** | **![][image8]** |

# **1.0 Introduction** 

Crowdfunding has emerged as a vital mechanism for entrepreneurial ventures seeking early-stage capital. However, traditional platforms such as Kickstarter and Indiegogo remain heavily dependent on centralised intermediaries that impose high transaction fees, delayed payment processing, and limited transparency (Cai, 2018). In response, blockchain technology and smart contracts have been proposed as a decentralised alternative capable of addressing these fundamental limitations. Smart contracts—self-executing programs deployed on distributed ledgers—can automate fund disbursement, enforce milestone-based release conditions, and provide immutable transaction records without requiring a trusted third party (Yadav & Sarasvathi, 2020).  
![][image9]  
*Figure 1.1: Show Crowdfunding* 

![][image10]  
*Figure 1.2 Shows The Smart Contract*  
StartupFund is a decentralised crowdfunding platform that operates on the Ethereum blockchain using Solidity smart contracts (Buterin, 2014). The platform is designed to enable startup founders to raise capital directly from contributors without relying on centralised intermediaries such as banks or traditional crowdfunding platforms. The design concept of StartupFund is inspired by **Shark Tank**, a well-known television program that supports entrepreneurship by allowing founders to pitch their business ideas to potential investors. Similar to Shark Tank's core idea, StartupFund provides a platform for entrepreneurs to present their projects and seek funding from interested contributors. However, unlike the television-based model, where a small group makes investment decisions of selected investors, StartupFund expands this concept to a decentralised, open-access environment. 

![][image11]  
*Figure 1.3 Shows Shark Tank, A Television Program.* 

By leveraging blockchain technology, the platform enables a wider audience to participate in funding decisions, thereby democratising access to capital and supporting entrepreneurial innovation at a global scale. By removing third parties, StartupFund reduces transaction costs, eliminates unnecessary delays, and increases trust between contributors and founders. Contributors can participate directly in funding campaigns, while all rules, deadlines, and fund disbursement are enforced transparently through Ethereum smart contracts.

StartupFund guarantees a high level of security, transparency, and trust throughout the fundraising process. Smart contracts are used to predefine and automatically enforce all campaign rules, including funding objectives, deadlines, refund requirements, and fund withdrawal. This ensures that no party can manipulate campaign outcomes or misuse contributed funds.

Contributors can track all transactions and campaign progress on-chain, providing full transparency into how funds are collected and managed. Startup founders may access the raised funds only if the campaign successfully meets its predefined funding requirements. If these conditions are. If it is fulfilled, contributors are eligible to receive automatic refunds. Compared to conventional crowdfunding systems, this strategy greatly reduces operational and administrative costs, promotes equality among all participants, and minimises the risk of fraud through transparent, immutable blockchain records.

# **2.0 Problem Statement**

1. The weakness of traditional crowdfunding platforms is that they rely heavily on centralised intermediaries such as banks and platform operators to manage fundraising campaigns, exposing campaigns to high service fees, delayed fund releases, limited transparency in fund management, and vulnerability to money laundering, which collectively reduce trust between startup founders and contributors.  
2. In many crowdfunding platforms, contributors have limited visibility into how their funds are handled and whether campaign rules are properly enforced. Without a transparent and automated mechanism, there is a higher risk of fraud, and contributors face a heightened risk of misuse or delayed refunds when funding goals are not achieved.  
3. Another weakness in many crowdfunding platforms is their reliance on centralised databases and servers, which are vulnerable to security breaches, data tampering, and unauthorised access, exposing sensitive contributor and campaign data to potential hacking and undermining trust in the platform's ability to safeguard funds and personal information.

# **3.0 Business Rule**

## **3.1 User Registration and Authentication** 

* Users must connect a valid blockchain wallet to access platform services.  
* Each wallet address belongs to one unique user account.  
* Users can act as entrepreneurs (product creators), contributors, or both.  
* Users cannot use smart contracts unless explicitly allowed by the platform.  
* Users must prove the wallet ownership using their own identity card.  
* Users' sessions expire automatically after being inactive.  
* Users cannot impersonate another wallet address.  
* Wallets that are considered flagged for malicious activity will be blocked by the platform.  
* A wallet attempting manipulation will be blocklisted.

## **3.2 Campaign Creation**

* Only registered or authenticated users can create the campaigns.  
* Each campaign must include the business name and project or product description, funding target (in ETH), deadline, and reward structure.  
* The funding goal of the campaign must be greater than zero and within platform-defined limits.  
* The campaign duration must fall within a valid time range (1-60 days)  
* The campaign creator cannot modify the platform’s terms and conditions after deployment.  
* Users cannot create multiple active campaigns for the same project.  
* Campaign duration must fall within platform-defined time boundaries.  
* A creator may not delete or cancel a campaign once funding is started if the creator has to email the platform and provide a valid reason to prove to them that the funding needs to be cancelled.

## **3.3 Funding Mechanism**

* Contributions are accepted only if the campaign status is ACTIVE and now \< deadline.  
* Each contribution must meet a minimum amount (e.g., \>= 0.001 ETH).  
* Contributions must be made using ETH.  
* A contributor can fund the same project or campaign multiple times.  
* Contribution will be locked in the smart contract until settlement.  
* Contribution cannot be withdrawn before campaign completion.

## **3.4 Success Funding of Campaign Policy**

* A campaign is successful if it has received enough funding or the funding is exceeded before the deadline.  
* The campaign success is determined automatically by smart content logic.  
* Only the campaign creator can withdraw the funds from the platform.  
* Funds can only be withdrawn once per project.  
* Partial withdrawals are not accepted or allowed.  
* The withdrawal will be blocked if reward token minting fails.

## **3.5 Refund Policy**

* If the funding goal is not met by the deadline, the campaign will be marked as cancelled.  
* Contributors can claim the refunds through the smart contract.  
* Refunding amount will be the same as the amount that the contributor's total funded amount.  
* Refunds will be claimed once per contributor in each project.  
* Refunds are processed directly from the smart contract.  
* After the refund, the contributors cannot get the rewards from the campaign.

## **3.6 Reward Token/ NFT Distribution** 

* Reward tokens or NFTs are issued only upon campaign success.  
* Reward allocation follows the formula: **1 Token \= 1 ETH contributed**  
* Rewards are minted automatically to contributor wallets.  
* Rewards cannot be minted to refunded contributors.  
* Reward distribution must be completed before fund withdrawal.  
* Each campaign defines a fixed reward supply.

## **3.7 Transaction History and Transparency**

* All campaign actions will be recorded on the chain as a record of the campaign information.  
* Users can view real-time and historical transaction data.  
* Campaign funding progress must be publicly visible.  
* Transaction records cannot be modified or deleted.  
* Smart contract events must be indexed for frontend display.

## **3.8 Security and Compliance**

* Smart contracts must prevent reentrancy and unauthorised access.  
* Funds may only be transferred through approved contract functions.  
* Emergency pause: the mechanisms may suspend sensitive operations.  
* The contract needs to be upgraded by requiring redeployment and user migration.  
* As the platform does not store private keys.

## **3.9 Platform Governance Rule**

* The platform does not custody user funds.  
* Administrators cannot modify campaign outcomes.  
* Governance actions must be transparent and auditable.  
* System upgrades require redeployment and user consent.  
* Governance contracts cannot access campaign funds.

## **3.10 Dispute and Liability Limitation**

* The platform will not be responsible for any dispute, loss, or claim arising after funds have been successfully withdrawn by a campaign creator to their own wallet.  
* Any disagreement related to project delivery, reward fulfilment, timelines, or business outcomes must be resolved directly between contributors and entrepreneurs. The platform does not participate in dispute resolution.  
*  The platform does not act as an escrow agent, mediator, arbitrator, guarantor, or enforcement authority for any project or transaction.  
* All smart contract executions are automatic, final, and irreversible once confirmed on the blockchain. The platform cannot reverse, modify, or cancel executed transactions.  
* Users acknowledge and accept the risks associated with smart contracts, including unexpected behaviour, vulnerabilities, or execution errors.  
* The platform does not guarantee project completion, business success, financial performance, or delivery of any rewards.  
* The blockchain transaction record is the sole and authoritative source of truth for all fund transfers and transaction history.  
* Platform interfaces, notifications, or off-chain data are provided for convenience only and do not override blockchain records.  
* To the maximum extent permitted by law, the platform is not liable for losses resulting from project failure, reward non-delivery, smart contract execution, user error, or third-party actions.  
* The platform operates solely as a technical infrastructure provider and does not act as a fiduciary, financial advisor, or business partner.

## **3.11 Security Risk Disclaimer** 

* Users acknowledge that blockchain-based platforms may be subject to hacking attempts, phishing attacks, scams, malware, or other unauthorised activities.  
* Users are responsible for securing their personal account, which includes wallets, private keys, login credentials, and devices.  
* The platform does not guarantee that it will be free from any security vulnerabilities or cyberattacks.  
* The platform does not guarantee absolute security and is not responsible for losses caused by hacking, phishing, scams, malware, or other cyber threats.  
* The platform is not liable for fraudulent or misleading campaigns created by users or third parties.  
* Any loss arising from third-party attacks, scams, or unauthorised access shall be borne solely by the user.  
* Users agree to conduct their own due diligence before participating in any campaign.

# **4.0 Objectives** 

Objectives of this project are to design and develop StartupFund, a decentralised crowdfunding platform for startup founders and investors or contributors as follow:

* To design and deploy the decentralised crowdfunding platform that can eliminate centralised intermediaries and enable direct interaction between startup founders and investors or contributors.  
* To implement Ethereum smart contracts that enforce the policy rules, such as funding targets, deadlines,refund policies and fund withdrawal conditions.  
* To provide secure user registration and authentication through the blockchain wallets connection, ensure that each wallet address represents a unique user identity.  
* To create, manage and publish the fundraising campaign with predefined funding goals, duration and reward structures for the entrepreneurs.  
* To allow the contributors to participate in the crowdfunding campaign by securing contributions in ETH to active projects using smart contracts.  
* To ensure transparent recording of all transactions, campaign activities and funding process on the blockchain for public verification.  
* To automate the success and failure logic of campaigns by allowing fund withdrawals only when the fund goals are met and enabling automatic refunds when campaigns fail.  
* To implement reward distribution mechanisms that include token or NFT minting based on contributors’ funding amounts.  
* To develop a user-friendly front-end interface that interacts with deployed Ethereum smart contracts for real-time campaign tracking and transaction display.  
* To enhance the trust and security of the crowdfunding platform by reducing risk, minimising the operational costs and enforcing all processes through transparent blockchain logic.

# **5.0 Contract Diagram**

![][image12]  
*Figure 5.0 : Contract Diagram*

StartupFund is a blockchain-based crowdfunding platform that employs smart contracts for safe, automated fundraising campaign management. Users can establish campaigns, distribute prize tokens, accept contributions from backers, and offer refunds in the event that campaigns are unsuccessful. Five smart contracts and two interfaces, each in charge of various tasks like campaign administration, reward distribution, fund storage, and access restriction, make up its architecture. By separating duties, this modular design enhances the security, maintainability, and transparency of the system.

A campaign developer initially begins a campaign with a financial target and deadline as part of the system's structured process. Funds donated by supporters are then safely kept in a vault until the campaign's conclusion. Backers receive reward tokens and the developer can withdraw funds if the funding target is met. Contributors may ask for reimbursement if the target is not reached. The platform has features like owner access control, reentrancy protection, emergency pause capability, escrow-based fund storage, and wallet verification procedures to stop fraudulent or illegal activity.

# **6.0 Activity Diagram**

![][image13]  
*Figure 6.0  Show Activity Diagram*

# **7.0 Use Case Diagram**

![][image14]  
*Figure 7.0 : Use Case Diagram*

# **8.0 System Architecture/Design Structure**

![][image15]  
*Figure 8.0: System Architecture*

The user is the single starting point from which the StartupFund decentralized application operates. Everything in this system, whether it is deploying contracts, uploading files, making contributions, or sharing content, is started by the user and spreads via a network of carefully linked tools.

The user uses Truffle, a framework for developing Solidity smart contracts, when the development phase starts. The user creates the smart contract code that will control all of the platform's regulations through Truffle, including funding objectives, due dates, refund logic, reward token minting, and withdrawal requirements. This code is compiled by Truffle, which then deploys it to the blockchain after running automated tests to ensure proper behavior. Truffle creates an ABI (Application Binary Interface) as part of this deployment. This is essentially a translation document that instructs the frontend on how to communicate with the smart contract, including what functions are available, what inputs they accept, and what they return. The browser wouldn't be able to communicate with the deployed contract without this step.

The user launches the browser-based frontend which is constructed with the React framework and interacts with the blockchain by a library known as Web3.js, when the contracts are deployed. Users can view campaigns, enter funding amounts, view transaction histories, upload assets, and initiate any action on the platform through this browser interface, which serves as the system's visual layer. However, because the browser lacks access to the user's private key and cannot sign anything on their behalf, it is unable to carry out blockchain transactions on its own. MetaMask can help in this situation. The user links MetaMask, a browser wallet extension, to the program. It serves as the gatekeeper for each on-chain action and safely stores the user's private key on their local device.The browser creates a transaction and sends it to MetaMask whenever the user wishes to do anything that interacts with the blockchain, including financing a campaign, taking money out of the funds raised, or recording a file hash. This transaction is presented to the user for approval by MetaMask, who then uses the user's private key to sign it before injecting the signed transaction back into the Web3 provider and forwarding it to the network. This implies that no transaction can be made without the user's express agreement and that their private key never leaves their device.

A signed transaction is sent to Ganache after MetaMask has signed it. During the project's development and testing stages, Ganache is a locally operating mimicked Ethereum blockchain. In terms of processing transactions, carrying out smart contract logic, and mining blocks, it functions just like the actual Ethereum network, but it runs solely on the developer's computer and doesn't require actual ETH or real gas payments. Because of this, it is the perfect setting for verifying that the frontend and smart contracts are functioning properly before putting them on the live network.After the system's functionality has been confirmed, Ganache acts as the bridge that broadcasts the signed transactions to the Ethereum blockchain after receiving them from MetaMask and the browser and processing them as though they were on the actual chain.

The InterPlanetary File System( IPFS)  is used by the system to manage file storage with this transaction flow. IPFS is a decentralized peer-to-peer storage network that eliminates the need for a central server by enabling file storage and retrieval. A file uploaded via the browser is sent straight to IPFS by the browser. After storing the file throughout its dispersed network, IPFS provides a unique content hash, which is a brief string of characters that serves as a permanent, impenetrable fingerprint of that particular file.In future, this hash will be utilized because keeping whole files on the Ethereum blockchain would be extremely expensive and impracticable due to gas prices rather than the actual file. So, a smart contract transaction records only the small content hash on the chain, producing an unchangeable proof that the file existed and was uploaded at that precise moment. As a result, the browser interacts with IPFS in two ways before submitting any on-chain transactions: it uploads the file and gets the hash back.

An encrypted shareable link can be created by the user using the content hash from IPFS. The user sends this link straight to an Outside User, who could not even have an account or wallet on the platform. This encrypted link is sent to the external user, who can utilize it to get the original file from IPFS. Although the hash is posted publicly on the blockchain, the encryption guarantees that only the intended receiver may view the file content. As a result, the file-sharing function remains private and content-level access-controlled while being open and verifiable on-chain.

At the bottom of the architecture, all of these flows from Truffle’s contract deployments, the content hashes from IPFS, the test broadcasts from Ganache, and the signed transactions from MetaMask,these all will converge on the Ethereum blockchain. For the entire system, the blockchain serves as a single and unchangeable source of truth. All formed campaigns which locked ETH contributions, processed refunds, minted reward tokens, and recorded file hashes ultimately become unchangeable entries on the Ethereum chain. Not even the platform administrators can alter, remove, or override data after it has been written there.The blockchain upholds the pre-written rules of the smart contracts, which are executed automatically without the need for human approval or verification. This is the fundamental principle of the entire architecture: StartupFund creates a system where trust is ingrained in the technology itself rather than relying on the honesty of any one individual or organization by routing every crucial action through the blockchain and utilizing tools like Truffle, MetaMask, Ganache, and IPFS to support that process.

# **9.0 UI Design**

**Home Page**  
The main page, also known as the “Home” page, serves as the central hub of StartupFund, where users can easily access important information about the platform. It allows users to explore a variety of startup campaigns or pitch their own ideas based on their interests and preferences. The design focuses on providing a clear, engaging, and user-friendly experience to help both entrepreneurs and investors navigate the platform effectively.  
![][image16]  
*Figure 9.1 Show The Home Page Of StartUpFund*

**Register Page**  
This is a page where users register their account in this website.User need to enter their display name, email address and their bio.Use also need to choose their position in which they want to be investor or entrepreneur.  
![][image17]  
*Figure 6.2 Show The Register Page Of StartUpFund*  
**Discover Page**  
The Discover page allows users to browse and explore different startup campaigns based on their interests.  
![][image18]  
*Figure 6.3 Show The Discover Page Of StartUpFund*  
**Campaign’s Fund Detail Page**  
This is a page which show the derail information for the campaign that require fund during their developing a new business process.  
![][image19]  
*Figure 6.4 Show The Campaign’s Fund Detail Page Of StartUpFund*  
**Launch Page**

![][image20]  
*Figure 6.5 Show The Launch Page Of StartUpFund*

# **10.0 Tools and Technologies Used**

| Tools and Technologies | Explanation  |
| ----- | ----- |
| Ethereum ![][image21] | Ethereum is a popular blockchain platform that uses smart contracts to let developers create and implement decentralized applications (dApps).Because of its extensive ecosystem and robust developer support, Ethereum remains one of the most important platforms for blockchain development (Ethereum, 2025). |
| Remix IDE (latest version) ![][image22] | RA browser-based programming environment called Remix IDE is used to create, compile, test, and implement Solidity smart contracts. With built-in facilities including a testing environment, debugging capabilities, and a Solidity compiler, developers can easily create and test smart contracts right in the browser without needing to install any extra software (Remix IDE, 2025).  |
| MetaMask Wallet (latest version) ![][image23] | A well-known cryptocurrency wallet and browser addon, MetaMask Wallet enables users to communicate with blockchain-based apps and manage Ethereum accounts. Users can transfer and receive cryptocurrencies, keep private keys securely, and easily connect to decentralized applications for transactions and smart contract interactions (MetaMask, 2025). |
| Ganache (latest version) ![][image24] | A local Ethereum blockchain environment is created for testing and development using the blockchain development tool Ganache. It helps save costs and expedite development by enabling developers to instantly test transactions, execute smart contracts, and mimic blockchain activities without utilizing the public Ethereum network (Ganache, 2025). |
| Solidity (latest version)![][image25] | The main programming language for creating smart contracts on the Ethereum blockchain is Solidity. With the help of smart contracts implemented on the Ethereum network, developers can create rules, automate transactions, and manage digital assets using this contract-oriented language created especially for blockchain applications (Solidity, 2025).  |

# **11.0 Limitations/challenges faced**

The high transaction fees (gas fees) connected to the Ethereum blockchain are one of the primary obstacles encountered during the creation of the StartupFund crowdfunding platform. Gas fees are required for every action carried out on the blockchain, including starting campaigns, making contributions, and taking money out. These costs can rise dramatically when the Ethereum network gets crowded. Small donors may be deterred from taking part in crowdfunding campaigns as a result of the transaction cost becoming comparatively expensive in relation to the amount they plan to provide.

The system was primarily evaluated in a development and testing environment rather than a completely secure production environment, which is another drawback. The project depended on testing tools like local blockchain simulators because implementing smart contracts on a public blockchain is complicated and expensive. Consequently, the platform has not yet been implemented in a completely secure real-world setting.

Furthermore, the platform uses a peer-to-peer blockchain construction, which means that user-to-user transactions take place without the need for a centralized authority. Although this increases decentralization and transparency, there are drawbacks as well, such less control over user behavior and trouble settling disagreements or dishonest behavior.

Lastly, actual cryptocurrency transactions are not used in the current implementation. To reduce financial risk during development, the system was instead evaluated using test or simulated network tokens. This method indicates that the platform has not yet been verified under actual financial circumstances on the live Ethereum network, even though it is appropriate for testing.  
**References**  
Buterin, V. (2014). *A next-generation smart contract and decentralised application platform*. Ethereum White Paper. [https://ethereum.org/en/whitepaper/](https://ethereum.org/en/whitepaper/)

Cai, C. W. (2018). Disruption of financial intermediation by FinTech: A review of crowdfunding and blockchain. *Accounting and Finance, 58*(4), 965–992. [https://doi.org/10.1111/acfi.12405](https://doi.org/10.1111/acfi.12405)

Yadav, N., & Sarasvathi, V. (2020). Venturing into crowdfunding using smart contracts on blockchain. In 2020 Third International Conference on Smart Systems and Inventive Technology (ICSSIT) (pp. 192–197). *IEEE.* [https://doi.org/10.1109/ICSSIT48917.2020.9214295](https://doi.org/10.1109/ICSSIT48917.2020.9214295)