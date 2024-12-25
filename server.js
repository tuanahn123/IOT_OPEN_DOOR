const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fetch = require('node-fetch');
const { user, accessLog } = require('./model/users.model');
require("./db");
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Middleware to log API calls
app.use((req, res, next) => {
    console.log(`Admin Log: ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    next();
});

// Lấy danh sách người dùng
app.get('/users', async (req, res) => {
    const users = await user.find();
    res.json(users);
});

app.post('/users', async (req, res) => {
    const { name, pin_code, rfid_code } = req.body;

    // Kiểm tra mã PIN chỉ có 4 chữ số
    if (pin_code && (!/^\d{4}$/.test(pin_code))) {
        return res.status(400).json({ error: 'Mã PIN phải có đúng 4 chữ số' });
    }

    try {
        // Kiểm tra mã PIN hoặc mã RFID có trùng lặp
        const existingUser = await user.findOne({
            $or: [
                { pin_code: pin_code || null },
                { rfid_code: rfid_code || null },
            ],
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Mã PIN hoặc mã RFID đã tồn tại' });
        }

        // Thêm người dùng mới
        const newUser = await user.create({
            name,
            pin_code: pin_code || null,
            rfid_code: rfid_code || null,
        });

        res.json(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi tạo người dùng' });
    }
});

// Mở cửa
app.post('/open-door', async (req, res) => {
    const { pin_code, rfid_code } = req.body;

    try {
        // Tìm người dùng dựa vào mã PIN hoặc mã RFID
        const foundUser = await user.findOne(
            pin_code
                ? { pin_code: pin_code }
                : { rfid_code: rfid_code }
        );

        if (foundUser) {
            // Ghi log truy cập vào bảng access_logs
            await accessLog.create({
                user_id: foundUser._id,
                access_type: pin_code ? 'PIN' : 'RFID',
                timestamp: new Date(),
            });

            res.json({ message: 'Cửa đã mở', success: true }); // Phản hồi thành công
        } else {
            res.status(401).json({ message: 'Mã PIN hoặc mã RFID không hợp lệ' }); // Phản hồi không thành công
        }
    } catch (error) {
        console.error('Error handling open-door request:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi trong quá trình xử lý' });
    }
});

// Lịch sử mở cửa
app.get('/access-logs', async (req, res) => {
    try {
        const logs = await accessLog.find()
            .populate('user_id', 'name') // Lấy trường `name` từ bảng `users`
            .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo giảm dần
            .exec();

        const formattedLogs = logs.map(log => ({
            name: log.user_id.name, // Tên người dùng từ bảng `users`
            access_time: log.createdAt.toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }),
            access_type: log.access_type,
        }));

        res.json(formattedLogs); // Trả về kết quả JSON
    } catch (error) {
        console.error('Error fetching access logs:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy lịch sử mở cửa' });
    }
});


// Xóa người dùng và lịch sử mở cửa của họ
app.delete('/users/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        await accessLog.deleteMany({ user_id: userId });

        const foundUser = await user.findByIdAndDelete(userId);

        if (!foundUser) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        res.json({ message: 'Người dùng và lịch sử mở cửa đã được xóa thành công' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa người dùng' });
    }
});


app.post('/open-door-manually', async (req, res) => {
    try {
        console.log('Sending request to ESP32 to open the door...');

        const response = await fetch('http://192.168.0.115:80/open-door', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            console.log('ESP32 responded successfully');

            // Tìm người dùng với mã RFID của admin
            const code = 'ToiLaAdminNhe';
            const adminUser = await user.findOne({ rfid_code: code });

            if (adminUser) {
                // Ghi lại lịch sử mở cửa
                await accessLog.create({
                    user_id: adminUser._id,
                    access_type: 'Admin',
                    access_time: new Date(),
                });

                return res.json({ message: 'Cửa đã mở', success: true }); // Phản hồi thành công
            } else {
                return res.status(401).json({ message: 'Mã RFID của admin không hợp lệ' }); // Phản hồi không thành công
            }
        } else {
            console.log('Failed to open door. Response not OK.');
            return res.status(500).json({ success: false, message: 'Không thể mở cửa' });
        }
    } catch (error) {
        console.error('Lỗi:', error);
        return res.status(500).json({ success: false, message: 'Lỗi kết nối đến ESP32' });
    }
});



app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
