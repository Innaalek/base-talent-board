import { useState, useEffect } from "react";
import { ethers } from "ethers";

const contractAddress = "0x0b4447778f4FE94C5a1ad10D3a3b4Fd3509d2A4D";

const abi = [
  "event MessagePosted(address indexed user, string message, uint256 timestamp)",
  "function postMessage(string calldata _text) external payable",
  "function getMessages() external view returns (tuple(address user, string text, uint256 timestamp)[])"
];

export default function MessageBoard() {
  const [contract, setContract] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Install MetaMask or Rabby Wallet!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    // Если сеть не Base — просим переключить
    if (network.chainId !== 8453n) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x2105" }], // Base Mainnet
        });
      } catch {
        alert("Please switch to Base Mainnet in your wallet!");
        return;
      }
    }

    const signer = await provider.getSigner();
    const c = new ethers.Contract(contractAddress, abi, signer);
    setContract(c);
    loadMessages(c);
  }

  async function loadMessages(c) {
    if (!c) return;
    try {
      const data = await c.getMessages();
      const formatted = data.map(m => ({
        from: m.user,
        text: m.text,
        time: new Date(Number(m.timestamp) * 1000).toLocaleString()
      }));
      setMessages(formatted);
    } catch (err) {
      console.error("Read error:", err);
    }
  }

  async function sendMessage() {
    if (!contract) {
      alert("Connect wallet first");
      return;
    }
    if (!message.trim()) return;

    try {
      const tx = await contract.postMessage(message, {
        value: ethers.parseEther("0.000005"), // 👈 МАЛЕНЬКАЯ КОМИССИЯ
      });
      await tx.wait();
      setMessage("");
      loadMessages(contract);
    } catch (err) {
      console.error("TX error:", err);
      alert("Transaction failed");
    }
  }

  // Подписываемся на новые сообщения
  useEffect(() => {
    if (!contract) return;
    const handler = (user, text, timestamp) => {
      setMessages(prev => [
        ...prev,
        { from: user, text, time: new Date(Number(timestamp) * 1000).toLocaleString() }
      ]);
    };
    contract.on("MessagePosted", handler);
    return () => contract.off("MessagePosted", handler);
  }, [contract]);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <button onClick={connectWallet}>Connect Wallet</button>

      <div style={{ marginTop: 20 }}>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Write a message..."
          style={{ width: "100%", padding: 10 }}
        />
        <button onClick={sendMessage}>Publish</button>
      </div>

      <h3>Messages on-chain:</h3>
      <ul>
        {messages.map((m, i) => (
          <li key={i}>
            <b>{m.from.slice(0,6)}...</b>: {m.text} <i>({m.time})</i>
          </li>
        ))}
      </ul>
    </div>
  );
}
