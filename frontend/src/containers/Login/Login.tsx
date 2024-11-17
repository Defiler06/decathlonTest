import {useState} from "react";
import CustomAlert from "../../components/CustomAlert/CustomAlert.tsx";
import {useNavigate} from "react-router-dom";

const Login = () => {
    const [username, setUsername] = useState<string>("");
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleLogin = () => {
        if (username.trim() === "") {
            showCustomAlert();
            return;
        }

        localStorage.setItem("username", username);
        setUsername("");
        navigate("/");
    };

    const showCustomAlert = () => {
        setShowAlert(true);

        setTimeout(() => {
            setShowAlert(false);
        }, 5000);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                    Вход в систему
                </h1>
                <p className="text-gray-600 text-center mb-6">
                    Пожалуйста, введите ваше имя пользователя.
                </p>
                <div className="flex flex-col gap-4">
                    <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Введите имя пользователя"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <button
                        onClick={handleLogin}
                        className="w-full bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 transition-all"
                    >
                        Войти
                    </button>
                </div>
            </div>

            {showAlert &&
                <CustomAlert message="Введите имя пользователя!" isError={true}/>
            }
        </div>
    );
};

export default Login;