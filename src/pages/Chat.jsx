import { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import Lottie from "react-lottie-player";
import typingAnimation from "../assets/typing.json";
import logo from "../assets/blackLogoSym.png";
import { IoSend } from "react-icons/io5";
import { RiResetLeftLine } from "react-icons/ri";
import { ShopContext } from "../context/ShopContext";

export default function Chat() {
    const { serverURL } = useContext(ShopContext);

    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [rotate, setRotate] = useState(false);

    const messagesEndRef = useRef(null);

    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem("luxora_chat_messages");

        if (!saved) {
            return [
                {
                    role: "ai",
                    content: "Welcome to Luxora! How can I assist you today? 😊",
                    products: [],
                },
            ];
        }

        try {
            return JSON.parse(saved).map((msg) => ({
                role: msg.role,
                content: msg.content,
                products: Array.isArray(msg.products) ? msg.products : [],
            }));
        } catch {
            return [
                {
                    role: "ai",
                    content: "Welcome to Luxora! How can I assist you today? 😊",
                    products: [],
                },
            ];
        }
    });

    const handleProductCheckout = (id) => {
        window.location.href = `https://luxora-fashionshop.vercel.app/product/${id}`;
    };

    const parseAgentResponse = (data) => ({
        greeting: data?.greeting || "Welcome to Luxora!",
        products: Array.isArray(data?.products)
            ? data.products.map((p) => ({
                  id: p.productId,
                  details: p.productDetails,
              }))
            : [],
    });

    /* -------------------- Effects -------------------- */

    useEffect(() => {
        localStorage.setItem("luxora_chat_messages", JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* -------------------- Handlers -------------------- */

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const question = input.trim();
        setInput("");
        setIsTyping(true);

        // ✅ Add user message (always normalized)
        setMessages((prev) => [
            ...prev,
            { role: "human", content: question, products: [] },
        ]);

        try {
            const res = await axios.post(
                `${serverURL}/search/product-query`,
                { question }
            );

            const { greeting, products } = parseAgentResponse(res.data);

            setMessages((prev) => [
                ...prev,
                { role: "ai", content: greeting, products },
            ]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    content:
                        "Sorry, I'm unable to answer right now. Please try again later.",
                    products: [],
                },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const resetChat = () => {
        const initialMessage = {
            role: "ai",
            content: "Welcome to Luxora! How can I assist you today? 😊",
            products: [],
        };

        setMessages([initialMessage]);
        localStorage.removeItem("luxora_chat_messages");

        setRotate(true);
        setTimeout(() => setRotate(false), 500);
    };

    /* -------------------- UI -------------------- */

    return (
        <div className="h-full w-full flex flex-col bg-white">
            {/* Header */}
            <div className="flex h-16 bg-cyan-300 rounded-t-lg items-center justify-between">
                <img className="w-8 h-8 mx-4" src={logo} alt="Luxora Logo" />
                <h1 className="text-gray-600 text-xl font-bold">
                    Chat with Luxora
                </h1>
                <button
                    onClick={resetChat}
                    className={`mr-8 text-2xl text-white bg-black rounded-full p-1 transition-transform duration-500 ${
                        rotate ? "-rotate-360" : ""
                    }`}
                >
                    <RiResetLeftLine />
                </button>
            </div>

            {/* Messages */}
            <div className="h-[28rem] overflow-y-auto space-y-2 mb-3 p-2 flex flex-col hide-scrollbar">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${
                            msg.role === "human"
                                ? "self-end text-right"
                                : "self-start text-left"
                        }`}
                    >
                        {msg.role === "ai" && (
                            <img
                                className="w-4 h-4 mr-2"
                                src={logo}
                                alt="Bot"
                            />
                        )}

                        <div
                            className={`p-2 px-4 max-w-[17rem] rounded-2xl break-words ${
                                msg.role === "human"
                                    ? "bg-cyan-200"
                                    : "bg-gray-200"
                            }`}
                        >
                            <p className="text-gray-700 text-sm whitespace-pre-line">
                                {msg.content}
                            </p>

                            {/* ✅ DEFENSIVE RENDERING */}
                            {Array.isArray(msg.products) &&
                                msg.products.map((product) => (
                                    <div
                                        key={product.id}
                                        className="mt-2"
                                    >
                                        <p className="text-gray-700 text-sm">
                                            {product.details}
                                        </p>
                                        <button
                                            onClick={() =>
                                                handleProductCheckout(
                                                    product.id
                                                )
                                            }
                                            className="bg-yellow-400 mt-2 px-4 py-1 rounded-2xl text-sm"
                                        >
                                            Buy Now
                                        </button>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="w-20 h-12 self-start">
                        <Lottie loop play animationData={typingAnimation} />
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
                onSubmit={handleSubmit}
                className="flex border-2 border-cyan-500 mx-4 rounded-2xl"
            >
                <input
                    className="flex-1 p-2 text-black focus:outline-none"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question..."
                />
                <button
                    type="submit"
                    className="px-4 rounded-r text-cyan-500 text-2xl"
                >
                    <IoSend />
                </button>
            </form>
        </div>
    );
}
