interface ICustomAlert {
    message: string;
    isError: boolean;
}

const CustomAlert = ({message, isError}: ICustomAlert) => {
    return (
        <div
            className={`fixed top-1.5 left-1/2 transform -translate-x-1/2 px-6 py-3
            rounded-lg text-white text-center shadow-lg transition-all 
            ${isError ? 'bg-red-500' : 'bg-green-500'}`}
        >
            {message}
        </div>
    );
};

export default CustomAlert;