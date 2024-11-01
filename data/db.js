const mysql = require("mysql2");

let connection = mysql.createConnection({
    host : "localhost",
    user : "root",
    password : "123456789",
    database : "sys"
});

connection.connect(function(err){
    if(err){
        return console.log(err);
    }

    connection.query("select * from todo",function(err,result){
        console.log(result[0].title)
    })
    
    console.log("Başarı ile Bağlandı");
});

module.exports = connection.promise();