import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import qr from 'qrcode';


import sqlite = require("sqlite3");
import { Socket } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

app.use(express.static('public'));
app.use(express.json());
app.use(cors());

sqlite.verbose();
const database = new sqlite.Database('./attendance.db');

database.serialize(() => {
    database.run(`
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            entered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            left_at DATETIME
        )
    `, (err) => {
        if (err) {
            console.error('Ошибка при создании таблицы:', err.message);
        } else {
            console.log('Таблица создана или уже существует');
        }
    });
});

const qrGenerationTimes: { [username: string]: number } = {};
const QR_EXPIRY_TIME = 600000;

const createNewQrCode = (username: string, currentTime: number, socket: Socket) => {
    const qrData = `${username}-${currentTime}`;

    qr.toDataURL(qrData, (err, url) => {
        if (err) {
            console.error('Ошибка при генерации QR:', err.message);
            socket.emit('error', 'Ошибка при генерации QR');
            return;
        }

        console.log(`QR сгенерирован для ${username}.`);

        qrGenerationTimes[username] = currentTime;
        console.log(qrGenerationTimes[username])

        socket.emit('qrGenerated', {
            qrUrl: url
        });
    });
};

io.on('connection', (socket) => {
    console.log('Пользователь подключился:', socket.id);

    socket.on('checkAttendance', (username) => {
        database.get('SELECT * FROM attendance WHERE username = ? AND left_at IS NULL', [username], (error: Error | null, row: {id: string}) => {
            if (error) {
                console.error('Ошибка при работе с базой данных:', error.message);
                socket.emit('error', 'Ошибка при запросе к базе данных');
                return;
            }

            if(row) {
                database.run('UPDATE attendance SET left_at = CURRENT_TIMESTAMP WHERE id = ?', [row.id], function (err) {
                    if (err) {
                        console.error('Ошибка при изменении записи в базе данных:', err.message);
                        socket.emit('error', 'Ошибка изменения записи');
                        return;
                    }

                    console.log(`Обновлен вход для ${username} (id: ${row.id}).`);
                    socket.emit('success', `Добро пожаловать, вы подтвердили вход по QR-коду`);
                });
            } else {
                database.run('INSERT INTO attendance (username) VALUES (?)', [username], function (error: Error | null) {
                    if (error) {
                        console.error('Ошибка при создании записи в базе данных:', error.message);
                        socket.emit('error', 'Ошибка при создании записи');
                        return;
                    }

                    console.log(`Создана новая запись для ${username}.`);
                    socket.emit('success', `Вы подтвердили выход по QR-коду`);
                });
            }
        });
    });

    socket.on('CheckGeneratedQr', (username) => {
        setInterval(() => {
            const lastGeneratedTime = qrGenerationTimes[username];
            const currentTime = Date.now();

            if (!lastGeneratedTime || currentTime - lastGeneratedTime > QR_EXPIRY_TIME) {
                createNewQrCode(username, currentTime, socket);
            } else {
                console.log(`Время еще не прошло`);
            }
        }, 60000);
    });

    socket.on('createNewQr', (username) => {
        const currentTime = Date.now();

        createNewQrCode(username, currentTime, socket);
    });

    socket.on('disconnect', () => {
        console.log('Пользователь отключился:', socket.id);
    });
});

app.get('/attendance', (req, res) => {
    database.all('SELECT * FROM attendance', (error: Error | null, rows: any[]) => {
        if (error) {
            console.error('Ошибка при запросе к базе данных:', error.message);
            return res.status(500).json({ error: 'Ошибка при запросе к базе данных' });
        }

        res.json(rows);
    });
});

server.listen(3002, () => {
    console.log('Сервер работает на http://localhost:3002');
});