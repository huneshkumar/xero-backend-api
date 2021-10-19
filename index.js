const express=require("express")
const https= require("https")
const xeroNode=require('xero-node')
const token=require('openid-client')
const jwt=require('jwt-decode')
const session = require('express-session');
const cors=require('cors')
const bp = require('body-parser')

const client_id = 'AF9A6BDFA30641FEB7195433ACB36072';
const client_secret = 'f3gICFwiJo0S-b2hboSWTwUaOI7_-x0PoM-RVTk54rfLozJq';
// const redirectUrl = 'https://quiet-hollows-10626.herokuapp.com/callback';
const redirectUrl = 'http://localhost:5000/callback';
const scopes = 'openid profile email accounting.settings accounting.reports.read accounting.journals.read accounting.contacts accounting.attachments accounting.transactions offline_access';
let id=''
const xero = new xeroNode.XeroClient({
	clientId: client_id,
	clientSecret: client_secret,
	redirectUris: [redirectUrl],
	scopes: scopes.split(' '),
});


if (!client_id || !client_secret || !redirectUrl) {
	throw Error('Environment Variables not all set - please check your .env file in the project root or create one!')
}


const app=express()
app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))
app.use(cors())


app.use(session({
	secret: 'something crazy',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: false },
}));
const authenticationData= (req, res) => {
	return {
		decodedIdToken: req.session.decodedIdToken,
		decodedAccessToken: req.session.decodedAccessToken,
		tokenSet: req.session.tokenSet,
		allTenants: req.session.allTenants,
		activeTenant:req.session.activeTenant,
	};
};

// app.get('/', (req, res) => {
// 	res.send(`<a href='/connect'>Connect to Xero</a>`);
// });

app.post('/', async (req, res) => {
	try {
		const consentUrl= await xero.buildConsentUrl();
		res.send(consentUrl);
		
	} catch (err) {
		res.send('Sorryyy, something went wrong');
	}
});




app.get('/callback', async (req, res) => {
	try {
		const tokenSet= token.TokenSet = await xero.apiCallback(req.url);
		await xero.updateTenants();

		const decodedIdToken= xeroNode.XeroIdToken = tokenSet.id_token
		const decodedAccessToken= xeroNode.XeroAccessToken = tokenSet.access_token

		req.session.decodedIdToken = decodedIdToken;
		req.session.decodedAccessToken = decodedAccessToken;
		req.session.tokenSet = tokenSet;
		req.session.allTenants = xero.tenants;
		// XeroClient is sorting tenants behind the scenes so that most recent / active connection is at index 0
		req.session.activeTenant = xero.tenants[0];

		const authData = authenticationData(req, res);
		id=req.session.activeTenant.tenantId
		console.log(authData);

		res.redirect('http://localhost:3000/callback');
	} catch (err) {
		res.send(err.message);
	}
});


app.get('/organisation', async (req, res) => {
	try {
		const tokenSet= token.TokenSet = await xero.readTokenSet();
		console.log(tokenSet.expired() ? 'expired' : 'valid');
		const response = await xero.accountingApi.getOrganisations(req.session.activeTenant.tenantId);
		res.send(`Hello, ${response.body.organisations[0].name} tentId ${req.session.activeTenant.tenantId}`);
	} catch (err) {
		res.send('Sorry, something went wronggg');
	}
});



app.post('/contact', async (req, res) => {
	try {
		const tokenSet=token.TokenSet = await xero.readTokenSet();
		console.log(tokenSet.expired() ? 'expired' : 'valid');
		console.log('data',req.body)
		let {name,fname,lname,phone,email}=req.body
		const contacts=xeroNode.Contacts= {
			contacts:[{
				name:name,
				firstName:fname,
				lastName:lname,
				emailAddress:email,
				phones:[{
					phoneType:xeroNode.Phone.PhoneTypeEnum.MOBILE,
					phoneNumber:phone,
					phoneAreaCode:"555"
				}],
				paymentTerms:{
					bills:{
						day:15,
						type:xeroNode.PaymentTermType.OFCURRENTMONTH
					},
					sales:{
						day:10,
						type:xeroNode.PaymentTermType.DAYSAFTERBILLMONTH
					}
				}
			}]
		}

		const response = await xero.accountingApi.createContacts(id,contacts);
		
		res.send("hiiiii");
		console.log(response.body)
		console.log(response.body || response.response.statusCode)
		
	} catch (err) {
		res.send(err.message);
		console.log(err)
	}
});

app.post('/invoice', async (req, res) => {
    const tokenSet= token.TokenSet = await xero.readTokenSet();
	let {contactId,amount,quantity,refrence,datevalue,dueDate}=req.body
    const xeroTenantId = id;
    const summarizeErrors = true;
    const unitdp = 4;
    const dateValue = datevalue
    const dueDateValue = dueDate
    
    const contact= xeroNode.Contact = { 
      contactID: contactId
    }; 
    // "8ae6a13d-7452-48ea-8586-6b5357110d29"
    const lineItemTracking=xeroNode.LineItemTracking = { 
      trackingCategoryID: contactId,
      trackingOptionID: contactId
    };   
    const lineItemTrackings = [];
    lineItemTrackings.push(lineItemTracking)
    
    const lineItem= xeroNode.LineItem = { 
      description: "New",
      quantity: quantity,
      unitAmount: amount,
      accountCode: "000",
      tracking: lineItemTrackings
    };   
    const lineItems = [];
    lineItems.push(lineItem)
    
    const invoice=xeroNode.Invoice = { 
      type: xeroNode.Invoice.TypeEnum.ACCREC,
      contact: contact,
      date: dateValue,
      dueDate: dueDateValue,
      lineItems: lineItems,
      reference: refrence,
      status: xeroNode.Invoice.StatusEnum.DRAFT
    }; 
    
    const invoices=xeroNode.Invoices = {  
      invoices: [invoice]
    }; 
    
    try {
      const response = await xero.accountingApi.createInvoices(xeroTenantId, invoices,  summarizeErrors, unitdp);
      console.log(response.body || response.response.statusCode)
      res.send(response.body)
    } catch (err) {
      const error = JSON.stringify(err.response.body, null, 2)
      console.log(`Status Code: ${err.response.statusCode} => ${error}`);
    }

})

app.post('/purchase',async (req,res)=>{
	const tokenSet= token.TokenSet = await xero.readTokenSet();

const xeroTenantId = id;
const summarizeErrors = true;
let {contactId,amount,quantity,description,datevalue}=req.body
const dateValue = datevalue


const contact= xeroNode.Contact = { 
  contactID: contactId
}; 

const lineItem=xeroNode.LineItem = { 
  description: description,
  quantity: quantity,
  unitAmount: amount,
  accountCode: "000"
};   
const lineItems = [];
lineItems.push(lineItem)

const purchaseOrder=xeroNode.PurchaseOrder = { 
  contact: contact,
  lineItems: lineItems,
  date: dateValue
}; 

const purchaseOrders=xeroNode.PurchaseOrders = {  
  purchaseOrders: [purchaseOrder]
}; 

try {
  const response = await xero.accountingApi.createPurchaseOrders(xeroTenantId, purchaseOrders,  summarizeErrors);
  console.log(response.body || response.response.statusCode)
} catch (err) {
  const error = JSON.stringify(err.response.body, null, 2)
  console.log(`Status Code: ${err.response.statusCode} => ${error}`);
}

})



app.get('/getInvoice', async (req, res) => {
    const tokenSet= token.TokenSet = await xero.readTokenSet();
        var invoiceId=req.params.invoiceId
    const xeroTenantId = req.session.activeTenant.tenantId;
const invoiceID = invoiceId;
const unitdp = 4;

try {
  const response = await xero.accountingApi.getInvoice(xeroTenantId, invoiceID,  unitdp);
  console.log(response.body || response.response.statusCode)
  res.send(response.body)
} catch (err) {
  const error = JSON.stringify(err.response.body, null, 2)
  console.log(`Status Code: ${err.response.statusCode} => ${error}`);
}
})


app.listen(process.env.PORT||5000,function(){
    console.log('server is runing on port 5000')
})