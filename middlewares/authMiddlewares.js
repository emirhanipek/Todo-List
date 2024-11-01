const authenticateToken = (req,res,next) => {
    const authHeader = req.headers['authorization'];
    console.log('authHeader',authHeader);
};

module.exports = authenticateToken; 
