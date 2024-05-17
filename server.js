const express = require("express");
const cors  = require("cors");
const mysql = require("mysql")
const path = require('path');
const fs = require('fs');

const corsOptions = {
    origin:'*',
}

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// const db = mysql.createConnection({
//     host:"localhost",
//     user:"root",
//     password:"",
//     database:"ams"
// })

//user:dave
//pwd:1QgaJ8dxXdbSBu0-oiW1YA
const db = mysql.createConnection({
  connectionLimit: 10,
  host: "sql12.freesqldatabase.com",
  user: "sql12707271",
  password: "WTbiPQ8KXg",
  database: "sql12707271",
  port: 3306
});


app.post('/login',(req,res) => {
    const sql = "SELECT password FROM creds WHERE `farmer_id` = ?";
    const fid = req.body.fid;
    const passwd = req.body.passwd;

    db.query(sql,[fid],(err,data)=> {
        //user not found - ask to signup
        if(data.length <= 0) {
            console.log('user not found');
            return res.json("notfound");
        }

        if(err){
            console.log("error : "+err);
            return res.json("Error");
        }

        else{
            
            const val = (data[0].password === passwd) ? 1 : 0;
            console.log(val);
            
            if(val){
                console.log("logged in!");
                return res.json("yes");
            }
            if(!val){
                console.log("password not correct!");
                return res.json("no");
            }
        }
    })
})


app.post('/Dashboard',(req,res) =>{
    const sql = "UPDATE METADATA SET STATUS='yes' WHERE `AadharNo` = ?";
    db.query(sql, [req.body.value],(err,data)=>{
        if(err){
            console.log("errror : "+ err);
            return res.json("Error");
        }
        if(data.affectedRows > 0){
            console.log(data);
            return res.json("Success");
        }
    })
})

app.post('/produces',(req,res) => {
    const sql = "SELECT * FROM CROPS where `farmer_id` = ?";
    db.query(sql,[req.body.farmer],(err,data)=>{

        if(err){
            console.log("error: " + err);
            return res.json("Error");
        }
        else{
            console.log(data);
            return res.json({'data':data});
        }
    })
})

app.post("/getValue", (req, res) => {
    const sql = "SELECT IFNULL(SUM(`price_per_unit` * `quantity`), 0) AS totalValue FROM crops WHERE farm_id = ?";
    const farmID = req.body.fID;

    db.query(sql, [farmID], (err, result) => {
        if (err) {
            console.log("Error: " + err);
            res.status(500).json({ error: "Internal server error" });
        } else {
            if (result.length > 0) {
                const totalValue = result[0].totalValue;
                console.log("Total value: " + totalValue);
                res.json({ totalValue: totalValue });
            } else {
                // Handle case where no data is found for the farmID
                res.status(404).json({ error: "No data found for the farm ID" });
            }
        }
    });
});


app.post('/getFarmID',(req,res)=>{
    const sql  = "select farm_id from farms where `farmer_id` = ?";
    db.query(sql,[req.body.farmerID],(err,data)=>{
        if(err){
            console.log("error: " + err);
        }
        else{
            console.log(data);
            return res.json(data);
        }
    })
})

app.post("/getFarms",(req,res)=>{
    const sql = "select * from farms where `farm_id` = ?";
    db.query(sql,[req.body.fID],(err,data)=>{
        if(err){
            console.log("error:" + err);
        }
        else{
            console.log("data:" + data);
            return res.json({"data" : data});
        }
    })
})

app.post("/addFarm",(req,res)=>{
    const sql = "insert into farms values(?,?,?,?,?)";
    const farm_id = req.body.farmID;
    const farm_name = req.body.farmName;
    const farm_size = req.body.farmSize;
    const farm_location = req.body.location;
    const farm_owner = req.body.farmerID;

    db.query(sql,[farm_id,farm_name,farm_location,farm_size,farm_owner],(err,data)=>{
        if(err){
            console.log("error : " + err);
        }
        else{
            console.log(data);
            return res.json({"data" : data});
        }
    })
})

app.post("/deleteFarm", (req, res) => {
    // Deleting the crops data first
    console.log(req.body.fID);
    const sql = "delete from crops where `farm_id` = ?";
    db.query(sql, [req.body.fID], (err, data) => {
        if (err) {
            console.log("error: " + err);
            return res.json("failed");
        }
        console.log(data);
        const sql1 = "delete from farms where `farm_id` = ?";
        db.query(sql1, [req.body.fID], (err, data) => {
            if (err) {
                console.log("error: " + err);
                return res.json("failed");
            }
            console.log(data);
            return res.json("deleted");
        });
    });
});

app.post("/addCrop", (req,res) => {
    const pID = req.body.produceID;
    const pName = req.body.produceName;
    const cat = req.body.Category;
    const price = req.body.Price;
    const qty = req.body.Quantity;
    const fID = req.body.farmID;
    const farmerID = req.body.farmer;
    console.log(farmerID);
    // produceID,produceName,Category,Price,Quantity,farmID
    const sql = "insert into crops values(?,?,?,?,?,?,?)";
    
    db.query(sql,[pID,pName,fID,qty,price,farmerID,cat],(err,data)=>{
        if(err){
            console.log("error: " + err);
            return res.json("failed");
        }
        console.log(data);
        return res.json("added");
    })
})

app.post("/stakeholders",(req,res)=>{
    
    const sql = "select * from stakeholders where `farmer_id` = ?";
    db.query(sql,[req.body.farmer],(err,data)=>{
        if(err){
            console.log("error: " + err);
            return res.json("failed");
        }
        console.log(data);
        return res.json(data);
    })
})

app.post("/editCrop",(req,res)=>{
    const old_crop_id = req.body.cID;
    const new_crop_id = req.body.produceID;
    const qty = req.body.Quantity;
    const price = req.body.Price;
    const category = req.body.Category;
    const name = req.body.produceName;
    const id = req.body.farmID;

    const sql = "update crops set `crop_id` = ?, `crop_name` =?, `farm_id` = ?, `quantity` =?, `price_per_unit` =?, `category` =? where `crop_id` =?";
    
    db.query(sql,[new_crop_id,name,id,qty,price,category,old_crop_id],(err,data)=>{
        if(err){
            console.log("error: " + err);
            return res.json("failed");
        }
        console.log(data);
        return res.json(data);
    })
})

app.post("/deleteCrop",(req,res)=>{
    const crop_id = req.body.crop_id;

    const sql = "delete from crops where `crop_id` = ?";
    db.query(sql,[crop_id],(err,data)=>{
        if(err){
            console.log('error: '+err);
            return res.json("failed");
        }
        console.log(data);
        return res.json("deleted");
    })
})

app.post("/sellCrop",(req,res)=>{
    const crop_id = req.body.crop_id;
    const crop_name = req.body.Order;
    const qty = req.body.qty;
    const stake_id = req.body.sID;
    const stake_name = req.body.sName;
    const farmer_id = req.body.farmer;

    const currentDate = new Date();

    // Get year, month, and day components
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed, so we add 1
    const day = String(currentDate.getDate()).padStart(2, '0');

    // Format date as yyyy-mm-dd
    const formattedDate = `${year}-${month}-${day}`;
    console.log(formattedDate);


    const sql = "select quantity,price_per_unit from crops where  `crop_id` = ?";
    db.query(sql,[crop_id],(err,data)=>{
        if(err){
            console.log('error: ' + err);
            return res.json("failed");
        }
        if(data[0].quantity-qty >=0){
            const sql1 = "update crops set `quantity` = ? where `crop_id` = ?";
            const amt = (data[0].quantity-qty) * (data[0].price_per_unit);
            console.log(amt);
            db.query(sql1,[data[0].quantity-qty,crop_id],(err,data)=>{
                if(err){
                    console.log("error: " + err);
                    return res.json("failed");
                }
                else{
                    const sql2 = "delete from stakeholders where `stakeholder_id` = ?";
                    db.query(sql2,[stake_id],(err,data)=>{
                        if(err){
                            console.log('error: ' + err);
                            return res.json("failed");
                        }
                        else{
                            const sql3 = "insert into orders(order_date,quantity,farmer_id) values(?,?,?)";
                            db.query(sql3,[formattedDate,qty,farmer_id],(err,data)=>{
                                if(err){
                                    console.log('error: ' + err);
                                    return res.json("failed");
                                }
                                else{
                                    console.log("I ran");
                                    const sql4 = "insert into stakes(stakeholder_name,stakeholder_id,amount,farmer_id) values(?,?,?,?)";
                                    db.query(sql4,[stake_name,stake_id,amt,farmer_id],(err,data)=>{
                                        if(err){
                                            console.log('error: ' + err);
                                            return res.json("failed");
                                        }
                                        else{
                                            console.log(crop_name);
                                            const sql5 = "insert into revenue(crop_id,farmer_id,crop_name,amt) values(?,?,?,?)";
                                            db.query(sql5,[crop_id,farmer_id,crop_name,amt],(err,data)=>{
                                                if(err){
                                                    console.log("error: " + err);
                                                    return res.json("failed");
                                                }
                                                else{
                                                    console.log("done!");
                                                    return res.json("sold");
                                                }
                                            }) 
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
        else{
            return res.json("not enough");
        }
    })
})

app.post("/getOrders",(req,res)=>{
    const fID = req.body.farmer;
    const sql = "select order_date,sum(quantity) as crops_sold from orders where `farmer_id` = ? group by order_date";

    db.query(sql,[fID],(err,data)=>{
        if(err){
            console.log("error: " + err);
            return res.json("failed");
        }
        else{
            console.log(data);
            return res.json(data);
        }
    })
})

app.post("/getStakes",(req,res)=>{
    const fID = req.body.farmer;
    const sql = "select stakeholder_name,stakeholder_id,sum(amount) as sales from stakes where `farmer_id` = ? group by stakeholder_id";
    
    db.query(sql,[fID],(err,data)=>{
        if(err){
            console.log("error: " + err);
            return res.json("failed");
        }
        else{
            console.log(data);
            return res.json(data);
        }
    })
})

app.post("/getRevenue",(req,res)=>{
    const fID = req.body.farmer;
    const sql = "select crop_name,crop_id,sum(amt) as revenue from revenue where `farmer_id` = ? group by crop_id";

    db.query(sql,[fID],(err,data)=>{
        if(err){
            console.log("error: " + err);
            return res.json("failed");
        }
        else{
            console.log(data);
            return res.json(data);
        }
    })
    
})

app.post("/addStakeholder",(req,res)=>{
    //stakeholderID,stakeholderName,Contact,Order,Quantity,CropID,farmer
    const sName = req.body.stakeholderName;
    const sID = req.body.stakeholderID;
    const contact = req.body.Contact;
    const order = req.body.Order;
    const qty = req.body.Quantity;
    const cID = req.body.CropID;
    const fID = req.body.farmer;

    const sql = "insert into stakeholders values(?,?,?,?,?,?,?)";

    db.query(sql,[sID,sName,contact,fID,order,cID,qty],(err,data)=>{
        if(err){
            console.log('error:' + err);
            return res.json("failed");
        }
        else{
            console.log(data);
            return res.json("added");
        }
    })
})

app.listen(8081, ()=>{
    console.log("Listening...");
})


