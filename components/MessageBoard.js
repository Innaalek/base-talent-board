import { useState, useEffect } from "react";
import { ethers } from "ethers";

const contractAddress = "0x2E1476Ba7D284e931389710904569FFdd1eC10F1";

const abi = [
  "event MessagePosted(address indexed user, string message, uint256 timestamp)",
  "function postMessage(string calldata _text) external",
  "function getMessagesCount() external view returns(uint256)",
  "function messages(uint256) external view returns(address user, string text, uint256 timestamp)"
];

export default function MessageBoard() {
  const [contract, setContract] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  async function connect() {
    if (!window.ethereum) return alert("Install wallet");
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const c = new ethers.Contract(contractAddress, abi, signer);
    setContract(c);
    load(provider);
  }

  async function load(provider) {
    const c = new ethers.Contract(contractAddress, abi, provider);
    const count = await c.getMessagesCount();
    const arr = [];
    for (let i = 0; i < count; i++) {
      const m = await c.messages(i);
      arr.push(m);
    }
    setMessages(arr);
  }

  async function publish() {
    if (!contract || !input.trim()) return;
    const tx = await contract.postMessage(input);
    await tx.wait();
    setInput("");
  }

  useEffect(() => {
    connect();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <button onClick={connect}>Connect Wallet</button>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Write a message..."
        style={{ width: "100%", padding: 10, marginTop: 10 }}
      />
      <button onClick={publish}>Publish</button>

      <h3>Messages on-chain:</h3>
      <ul>
        {messages.map((m,i) => (
          <li key={i}>{m.text}</li>
        ))}
      </ul>
    </div>
  );
}
