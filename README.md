# xero-backend-api
/callback-- it will reditrect u for xero authentication 
  ![image](https://user-images.githubusercontent.com/73880479/137920495-c3fc4e91-f1d5-4a46-b271-0f2203c4e7c3.png)
it will redirect u above page 

/contact-- this endpoint is used for creating contact for demo company
for creating contact this api accepts few inputs 
1.name:string
2.firstName:string
3.secondName:string
4.emailAddress:string
5.phone:number

/invoice-- this endpoint is used for creating invoice for customers/contacts
for creating invoice this api accepts few inputs 
u need contact id 
for creating invoice , you will find contact id in console/terminal or u can find this in xero account when u click on contact name u will find contact in in URl
![image](https://user-images.githubusercontent.com/73880479/137922007-5ee53671-d636-4a0d-a390-931eb6ea24c4.png)

1.contactId:string
2.amount:number
3.quantity:number
4.due date:mm/dd/yy (date)
5.date:mm/dd/yy (date)


/purchase-- this endpoint is used for creating purchase orders 

for creating purchase order this api accepts few inputs 
u need contact id 
for creating invoice , you will find contact id in console/terminal or u can find this in xero account when u click on contact name u will find contact in in URl
![image](https://user-images.githubusercontent.com/73880479/137922007-5ee53671-d636-4a0d-a390-931eb6ea24c4.png)

1.contactId:string
2.amount:number
3.quantity:number
4.description:String
5.date:mm/dd/yy (date)


/getinvoice
to fetch invoices u need invoice id 
u will get this from 
![image](https://user-images.githubusercontent.com/73880479/137923746-8764c21a-c89e-49b3-b72c-0c0c2a6a5c3e.png)




