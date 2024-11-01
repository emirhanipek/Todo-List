const express = require("express");
const router = express.Router();
const session = require("express-session");
const bcrypt = require('bcrypt');
const db = require("../data/db");
const jwt = require('jsonwebtoken');
require('dotenv').config(); // .env dosyasını bir kez yükle
const authMiddleware = require('../middlewares/authMiddlewares');

router.use(express.urlencoded({ extended: true }));

const createtoken = (userId) =>{
    return jwt.sign({userId},process.env.JWT_SECRET,{
        expiresIn : '1d',
    });
};

router.post("/login", async function (req, res) {
    const { email, pass } = req.body;
    console.log(email, " +++ ", pass);

    try {
        const [rows] = await db.execute("SELECT * FROM user WHERE email = ?", [email]);

        if (rows.length === 0) {
            console.log("Giriş başarısız: Kullanıcı bulunamadı.");
            return res.status(401).send("Giriş başarısız: Kullanıcı bulunamadı."); // Yanıt gönderildikten sonra return ile durduruyoruz
        }

        const user = rows[0];
        console.log(user);
        const hashedPassword = user.password;
        const responseData = {
            user,
            token: createtoken(user.user_id)
        };

        // Kullanıcı giriş yapmışsa `user_id` session'da saklanır
        req.session.isAuth = true;
        req.session.user_id = responseData.user.user_id;
        req.session.name = responseData.user.name;

        console.log(responseData.token);
        console.log(responseData.user.email);
        console.log(responseData.user.name);
        const isPasswordValid = await bcrypt.compare(pass, hashedPassword);
        if (!isPasswordValid) {
            console.log("Giriş başarısız: Şifre yanlış.");
            return res.status(401).send("Giriş başarısız: Şifre yanlış."); // Yanıt gönderildikten sonra return ile durduruyoruz
        }

        res.redirect("/");
        console.log("Giriş başarılı.");
        
    } catch (error) {
        console.error("Veritabanı hatası:", error);
        return res.status(500).send("Veritabanı hatası."); // Hata durumunda da return kullanarak işlemi durduruyoruz
    }
});


//Todo GET UPDATE
router.get("/update/:todoid", async function(req, res) {
    const todoid = req.params.todoid;
    
    try {
        const [results] = await db.execute("SELECT * FROM todo WHERE id = ?", [todoid]);
        const result = results[0];

        res.render("../views/admin/update", {
            title: "Update Sayfası",
            veri: result,
        });
    }
    catch (err) {
        console.log(err);
    }
});
//TODO GET ADD
router.get("/add", async function(req,res) {
    try{
        res.render("../views/admin/add",{
            title : "Ekleme Sayfası"
        })
    }
    catch(err){
        console.log(err)
    }
});

//Todo DET DELETE
router.get("/delete/:todoid", async function(req, res) {
    const todoid = req.params.todoid;
    
    try {
        const [results] = await db.execute("SELECT * FROM todo WHERE id = ?", [todoid]);
        const result = results[0];

        res.render("../views/admin/delete", {
            title: "Delete Sayfası",
            veri: result,
        });
    }
    catch (err) {
        console.log(err);
    }
});

//todo POST UPDATE
router.post("/update/:todoid", async function(req, res) {
    const todoid = req.params.todoid;
    const { title, contact , formselect } = req.body; 

    try {
        await db.execute(
            "UPDATE todo SET title = ?, contact = ? , durum = ? WHERE id = ?",
            [title, contact , formselect , todoid]
        );
        res.redirect(`/`); 
    } catch (err) {
        res.redirect("/");
        console.error(err);
        
    }
});

//TODO POST REGİSTER
router.post("/register" ,async function register(req, res) {
    const { email, password , surname } = req.body;

    console.log(email,password ,surname)

    try {

        const [rows] = await db.execute("SELECT * FROM user WHERE email = ?", [email]);

        if (rows.length > 0) {
            console.log("Kayıt başarısız: Bu email zaten kullanılıyor.");
            return res.status(409).send("Kayıt başarısız: Bu email zaten kullanılıyor.");
        }

        if (!password) {
            console.log("Kayıt başarısız: Şifre gereklidir. ? ",password);
            return res.status(400).send("Kayıt başarısız: Şifre gereklidir.");
        }

        const saltRounds = 10; 
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log(hashedPassword);

        await db.execute("INSERT INTO user (email, password , name ) VALUES (?, ? , ?)", [email, hashedPassword, surname]);

        console.log("Kayıt başarılı.");
        res.redirect("/login");
    } catch (error) {
        console.error("Veritabanı hatası:", error);
        res.status(500).send("Veritabanı hatası.");
    }
});
//TODO POST ADD
router.post("/add", async function(req, res) {
    const { title, contact, formselect } = req.body;
    const userId = req.session.user_id;
    try {
        await db.execute(
            "INSERT INTO todo (user_id,title, contact, durum) VALUES (?,?, ?, ?)",
            [userId,title, contact, formselect]
        );
        res.redirect('/');
    } catch (err) {
        console.log(err);
        res.redirect("/");
    }
});

router.get("/logout", async function(req, res) {
    try {
        // Oturumu kapatma
        req.session.destroy((err) => {
            if (err) {
                console.error("Oturum kapatma hatası:", err);
                return res.status(500).send("Sunucu hatası.");
            }

            // Ana sayfaya yönlendirme
            res.redirect("/");
        });
    } catch (error) {
        console.error("Logout işleminde hata:", error);
        res.status(500).send("Sunucu hatası.");
    }
});

//TODO POST DELETE 
router.post("/delete/:todoid", async function(req, res) {
    const todoid = req.params.todoid;

    try {
        await db.execute("DELETE FROM todo WHERE id = ?", [todoid]);
        res.redirect("/"); 
    } catch (err) {
        console.error(err); 
        res.redirect("/"); 
    }
});


//TODO GET REGİSTER
router.get("/register", (req, res) => {
    res.render("register");
});

//TODO GET LOGİN
router.get("/login", (req, res) => {
    res.render("../views/login",{
        title : "Login Page",
    });
});
        
//TODO GET HOME
router.get("/", async (req, res) => {
    try {
        const userId = req.session.user_id;
        const name = req.session.name;
        console.log(userId,name, "sadads");

        // userId'nin varlığını kontrol edin
        if (!userId) {
            return res.redirect("/login");
        }

        // Veritabanı sorgusu
        const [result] = await db.execute("SELECT * FROM todo WHERE user_id = ?", [userId]);
        console.log(result);

        // Sayfayı render etme
        res.render("./home.ejs", { // Şablon adını doğru belirtin, örneğin 'index'
            baslik: name,
            title: result // `result` zaten bir dizi olduğu için doğrudan aktarılabilir
        });
    } catch (err) {
        console.error("Veritabanı hatası:", err);
        res.status(500).send("Sunucu hatası.");
    }
});

module.exports = router;