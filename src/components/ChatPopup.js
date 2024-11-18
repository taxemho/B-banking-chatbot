import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./ChatPopup.css";
import botLogo from "../assets/botLogo.png"; // Bot logo
import userLogo from "../assets/userLogo.png"; // User logo
import logoBSNL from "../assets/logoBSNLbot.png.png";
import restart from "../assets/restart.png";
import expand from "../assets/expand.png";
import close from "../assets/close.png";

const ChatPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [mainMenu, setMainMenu] = useState([]);
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const [showMainMenuButton, setShowMainMenuButton] = useState(true);
  const [currentServiceKey, setCurrentServiceKey] = useState("");

  const chatEndRef = useRef(null);

  // Toggle popup visibility and load main menu on open
  const togglePopup = async () => {
    if (!isOpen) {
      setIsOpen(true);
    } else {
      resetChat();
    }
  };
// Toggle full-screen mode
  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev);
  };
  // Fetch main menu options from API
  const loadMainMenu = async () => {
    try {
      const response = await axios.get('http://172.30.10.200:4455/api-chatbot/menu');
      setMainMenu(response.data.data);
      setShowMainMenuButton(false);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Click on one of the options below:' },
      ]);
    } catch (error) {
      console.error('Error fetching menu:', error);
      setChatMessages([{ sender: 'bot', text: 'Failed to load menu. Please try again.' }]);
    }
  };

  // Handle user message (e.g., "hi") and fetch greeting response


  // Handle main menu selection to show sub-options
  const handleMenuClick = (menuItem) => {
    setChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: `You selected: ${menuItem.name}` },
    ]);

    if (!menuItem.subMenu) {
      // Handle Dealer Status Check (or other menu items without suboptions)
      setMainMenu([]); // Hide main menu immediately
      setActiveSubMenu(null);
      setCurrentServiceKey(menuItem.serviceKey);

      let promptMessage = '';
      if (menuItem.serviceKey === 'DLY_STUS_CH') {
        promptMessage = 'Please enter your mobile number for dealer status check.';
      }

      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: promptMessage },
      ]);
      setShowMainMenuButton(false); // Hide main menu button
    } else {
      setActiveSubMenu(menuItem.subMenu || null);
    }
  };
  // Handle user input submission
  const handleInputSubmit = async () => {
    if (!inputValue) return;

  // Add user message to chat
  setChatMessages((prev) => [...prev, { sender: 'user', text: inputValue }]);

  if (inputValue.toLowerCase() === 'hi') {
    try {
      const response = await axios.post('http://172.30.10.200:4455/api-chatbot/message', { userInput: inputValue });
      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: response.data.data || 'No response received' },
      ]);
      setShowMainMenuButton(true); // Show main menu button after greeting response
    } catch (error) {
      console.error('Error sending message:', error);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Error fetching greeting. Please try again.' },
      ]);
    }
    setInputValue('');
    return;
  }

  let requestBody = {};

  // Build request body based on service key
  if (currentServiceKey === 'BAL_ENQ_PRE' || currentServiceKey === 'BAL_ENQ_POST') {
    requestBody = {
      msisdn: inputValue,
      serviceKey: currentServiceKey
    };
  } else if (currentServiceKey === 'TR_STUS_PRE' || currentServiceKey === 'TR_STUS_POST') {
    requestBody = {
      serviceKey: currentServiceKey,
      trid: inputValue
    };
  } else if (currentServiceKey === 'DLY_STUS_CH') {
    requestBody = {
      msisdn: inputValue,
      serviceKey: currentServiceKey
    };
  }

  try {
    // Make API call to get details
    const response = await axios.post('http://172.30.10.200:4455/api-chatbot/get-details', requestBody);
    const botResponse = response.data.template || "No response received";
    setChatMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
    if (botResponse === "No response received") {
      setShowMainMenuButton(true);
    }
  } catch (error) {
    console.error('Error fetching details:', error);
    setChatMessages((prev) => [
      ...prev,
      { sender: 'bot', text: 'Error fetching details. Please try again.' }
    ]);
    setShowMainMenuButton(true);
  }

  // Reset input stage and values after request
  setInputValue('');
  setCurrentServiceKey('');
};

  // Handle sub-option selection (e.g., Prepaid Wallet or Postpaid Wallet)
  const handleSubOptionClick = async (subOption) => {
    const promptMessage =
      subOption.serviceKey.includes("BAL_ENQ") ? "Please enter your mobile number for balance enquiry." :
      subOption.serviceKey.includes("TR_STUS") ? "Please enter the transaction ID for transaction status." :
      subOption.serviceKey === "DLY_STUS_CH" ? "Please enter your mobile number for dealer status check." :
      "";

    setChatMessages((prev) => [...prev, { sender: "bot", text: promptMessage }]);
    setMainMenu([]);
    setActiveSubMenu(null);
    setShowMainMenuButton(false);
    setInputValue("");
    setCurrentServiceKey(subOption.serviceKey);
  };

  const resetChat = () => {
    setChatMessages([]);
    setInputValue('');
    setMainMenu([]);
    setActiveSubMenu(null);
    setCurrentServiceKey('');
    setShowMainMenuButton(true);
  };

  // Scroll to the bottom of the chat when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  return (
    <>
      <img 
        src={logoBSNL} // Replace `closeIcon` with your new icon
        alt="Chat Icon" 
        className="chat-logo" 
        onClick={togglePopup} 
      />
      {isOpen && (
        <div className={`chat-popup ${isFullScreen ? 'fullscreen' : ''}`}>
          <div className="chat-header">
            <h3>Virtual Assistant</h3>
            <div className="header-btns">
              <img
                src={expand}
                alt="full screen"
                className="fullscreen-btn"
                onClick={toggleFullScreen}
              />
              <img
                src={restart} // Reset button icon
                alt="Reset"
                className="reset-btn"
                onClick={resetChat}
              />
              <img src={close} alt="closebot" onClick={() => setIsOpen(false)} className="header-btn"/>
          </div>
          </div>
          <div className="chat-messages">
            {chatMessages.map((message, index) => (
              <div key={index} className={`message-container ${message.sender}`}>
                {message.sender === 'bot' && (
                  <div className="message-logo">
                    <img src={botLogo} alt="Bot Icon" className="icon-bot" />
                  </div>
                )}
                <div className={`message-bubble ${message.sender}`}>
                  <p className="message-text">{message.text}</p>
                </div>
                {message.sender === 'user' && (
                  <div className="message-logo">
                    <img src={userLogo} alt="User Icon" className="icon-user" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {showMainMenuButton && (
            <button onClick={loadMainMenu} className="main-menu-btn small-btn">Main Menu</button>
          )}

          <div className="menu-container">
            {!activeSubMenu && mainMenu.length > 0 && (
              <div>
                {mainMenu.map((menuItem) => (
                  <div key={menuItem.id} className="menu-item">
                    <button onClick={() => handleMenuClick(menuItem)} className="menu-btn">
                      {menuItem.name}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeSubMenu && (
              <div className="sub-options">
                {activeSubMenu.map((subOption, index) => (
                  <button
                    key={index}
                    onClick={() => handleSubOptionClick(subOption)}
                    className="sub-option-btn"
                  >
                    {subOption.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="input-section">
            <input
              type="text"
              placeholder="Type Hi to start"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
              className="input-field"
            />
            <button onClick={handleInputSubmit} className="submit-btn small-btn">Send</button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatPopup;
