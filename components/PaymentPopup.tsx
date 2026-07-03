import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PopupProps {
    isOpen: boolean;
    onClose: () => void;
    onAutoClose?: () => void;
    type: 'success' | 'failure';
    title: string;
    message: string;
    buttonText?: string;
    onButtonClick?: () => void;
    autoCloseDelay?: number;
}

export default function Popup({
    isOpen,
    onClose,
    onAutoClose,
    type,
    title,
    message,
    buttonText = 'OK',
    onButtonClick,
    autoCloseDelay = 3000,
}: PopupProps) {
    // Handle auto-close for success popups
    useEffect(() => {
        if (isOpen && type === 'success') {
            const timer = setTimeout(() => {
                if (onAutoClose) {
                    onAutoClose();
                } else {
                    onClose();
                }
            }, autoCloseDelay);

            return () => clearTimeout(timer);
        }
    }, [isOpen, type, onClose, autoCloseDelay, onAutoClose]);

    // Handle Escape key to close
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when popup is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleButtonClick = () => {
        if (onButtonClick) {
            onButtonClick();
        } else {
            onClose();
        }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getStyles = () => {
        if (type === 'success') {
            return {
                circle: 'stroke-green-500',
                checkmark: 'stroke-green-500',
                bg: 'bg-green-50',
                border: 'border-green-200',
                iconBg: 'bg-green-100',
                titleColor: 'text-green-800',
                messageColor: 'text-green-700',
                buttonBg: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
            };
        }
        return {
            circle: 'stroke-red-500',
            checkmark: 'stroke-red-500',
            bg: 'bg-red-50',
            border: 'border-red-200',
            iconBg: 'bg-red-100',
            titleColor: 'text-red-800',
            messageColor: 'text-red-700',
            buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        };
    };

    const styles = getStyles();

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
            onClick={handleBackdropClick}
        >
            <div
                className={`w-full max-w-md mx-4 ${styles.bg} border ${styles.border} rounded-2xl shadow-2xl p-6 animate-scaleIn`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="popup-title"
            >
                <div className="flex flex-col items-center text-center">
                    {/* Animated Icon */}
                    <div className="relative mb-4">
                        <div
                            className={`w-20 h-20 rounded-full ${styles.iconBg} flex items-center justify-center`}
                        >
                            {type === 'success' ? (
                                <svg
                                    className="w-12 h-12"
                                    viewBox="0 0 52 52"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-hidden="true"
                                >
                                    <circle
                                        className={`${styles.circle} animate-circleCheck`}
                                        cx="26"
                                        cy="26"
                                        r="25"
                                        fill="none"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className={`${styles.checkmark} animate-checkmarkDraw`}
                                        fill="none"
                                        strokeWidth="4"
                                        d="M14.1 27.2l7.1 7.2 16.7-16.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="w-12 h-12"
                                    viewBox="0 0 52 52"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-hidden="true"
                                >
                                    <circle
                                        className={`${styles.circle} animate-circleCheck`}
                                        cx="26"
                                        cy="26"
                                        r="25"
                                        fill="none"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className={`${styles.checkmark} animate-failureDraw`}
                                        fill="none"
                                        strokeWidth="4"
                                        d="M16 16l20 20M36 16L16 36"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <h3 id="popup-title" className={`text-xl font-bold ${styles.titleColor} mb-2`}>
                        {title}
                    </h3>
                    <p className={`${styles.messageColor} mb-6`}>{message}</p>

                    {/* Action Button */}
                    <button
                        onClick={handleButtonClick}
                        className={`px-6 py-2.5 ${styles.buttonBg} text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
                        autoFocus
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}