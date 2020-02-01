const express = require('express')
const bodyparser = require('body-parser')
const session = require('express-session')
const connection = require('./utility/mysqlConn')
const path = require('path')
const fs = require('fs')
const homeRouter = require('./router/home')
const userRouter = require('./router/user')
const adminRouter = require('./router/admin')
const app = express()

const PORT = process.env.PORT || 3000

app.use(bodyparser.urlencoded({extended:false}))
app.use(bodyparser.json())

// Inbuild Middleware
app.use(express.static(path.join(__dirname,'public')))

// Session Setup
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: true,
    saveUninitialized: true
}))

// View Engine Setup
app.set('views',path.join(__dirname,'templates/views'))
app.set('view engine','ejs')

//Saving All pictures to desired location from database
var sql = "select * from uploads";
connection.query(sql,function(error,result){

    if(error) throw error
    
    for(i = 0; i < result.length; i++)
    {
        fs.writeFile(result[i].path, result[i].imageData,'base64', function(err) {
            if(err) console.log(err)
        });
    }
}) 

// Router Handler
app.use('/',homeRouter)
app.use('/user',userRouter)
app.use('/admin',adminRouter)

app.get('*',function(req,res){
    res.render('404');
})

// Server
app.listen(PORT,function(error){
    if(error) throw error
    console.log("Server created Successfully on Port",PORT)
})