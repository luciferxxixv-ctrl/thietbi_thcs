const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_thietbi_thcs';

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(403).json({ msg: 'Bạn chưa đăng nhập (Không tìm thấy token)!' });
    }

    const token = authHeader.split(' ')[1]; // "Bearer <token>"
    
    if (!token) {
        return res.status(403).json({ msg: 'Token không hợp lệ!' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Lưu vào request: { maGV, role }
        next();
    } catch (err) {
        return res.status(401).json({ msg: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ!' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ msg: 'Bạn không có quyền quản trị để thực hiện chức năng này!' });
    }
};

module.exports = { verifyToken, isAdmin };
