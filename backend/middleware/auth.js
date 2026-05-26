const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();


module.exports = function (requiredRole) {
return function (req, res, next) {
const token = req.header('Authorization')?.replace('Bearer ', '');
if (!token) return res.status(401).json({ message: 'No token, authorization denied' });


try {
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded; // { id, role }
if (requiredRole && req.user.role !== requiredRole) {
return res.status(403).json({ message: 'Forbidden: insufficient role' });
}
next();
} catch (err) {
console.error(err);
res.status(401).json({ message: 'Token is not valid' });
}
};
};