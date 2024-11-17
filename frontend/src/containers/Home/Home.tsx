import {io, Socket} from 'socket.io-client';
import {useEffect, useRef, useState} from "react";
import CustomAlert from "../../components/CustomAlert/CustomAlert.tsx";


const Home = () => {
    const [username] = useState<string | null>(localStorage.getItem('username'));
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState<boolean>(false);

    const socketClient = useRef<Socket>();


    const handleEnterClick = () => {
        if (!username) return;

        if(socketClient.current) {
            socketClient.current.emit('checkAttendance', username);
            socketClient.current.emit('createNewQr', username);

            socketClient.current.on('success', (successMessage) => {
                setMessage(successMessage);
                setIsError(false);

                setTimeout(() => {
                    setMessage(null);
                }, 5000);
            });

            socketClient.current.on('error', (errorMessage: string) => {
                setMessage(errorMessage);
                setIsError(true);

                setTimeout(() => {
                    setMessage(null);
                }, 5000);
            });
        }
    };

    useEffect(() => {
        socketClient.current = io('http://localhost:3002');

        socketClient.current.emit('createNewQr', {username});
        socketClient.current.emit('CheckGeneratedQr', {username});
        socketClient.current.on('qrGenerated', (data: {qrUrl: string}) => {
            setQrCode(data.qrUrl)
        });

        return () => {
            if (socketClient.current) {
                socketClient.current.emit('disconnect')
                socketClient.current.off();
            }
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            {message &&
                <CustomAlert message={message} isError={isError} />
            }
            <h1 className="text-xl font-semibold mb-4 text-center">
                Отсканируйте код для того, чтобы подтвердить приход или уход
            </h1>
            {qrCode && <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                <img src={qrCode} alt="qr-code" className="w-64 h-64 object-contain"/>
            </div>}

            <div className="flex gap-4">
                <button
                    className="bg-blue-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onClick={handleEnterClick}
                >
                    Сканировать QR
                </button>

                <button
                    className="bg-green-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                    onClick={() => {
                        localStorage.removeItem('username');
                        window.location.href = '/login';
                    }}
                >
                    Сменить пользователя
                </button>
            </div>
        </div>
    );
};

export default Home;