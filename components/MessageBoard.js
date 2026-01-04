import { useState, useEffect } from "react";
import { ethers } from "ethers";

const contractAddress = "0x2E1476Ba7D284e931389710904569FFdd1eC10F1";

const abi = [
  "function postMessage(string text) public",
  "function getMessages() public view returns (tuple(address from, string text, uint256 timestamp)[])",
  "event NewMessage(address indexed from, string text, uint256 timestamp)"
];

export default function MessageBoard() {
  const [contract, setContract] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  async function switchToBase() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x2105" }],
      });
    } catch (err) {
      console.error("Switch chain error:", err);
      alert("Please manually switch to Base Mainnet in Rabby wallet");
    }
  }

  async function initContract() {
    if (!window.ethereum) return;
    await switchToBase();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const c = new ethers.Contract(contractAddress, abi, signer);
    setContract(c);
    loadMessages(c);
  }

  async function loadMessages(c) {
    try {
      const data = await c.getMessages();
      const list = data.map(m => ({
        from: m.from,
        text: m.text,
        time: new Date(Number(m.timestamp) * 1000).toLocaleString()
      }));
      setMessages(list);
    } catch (err) {
      console.error("Load messages error:", err);
    }
  }

  async function publishMessage() {
    if (!contract || !input.trim()) return;
    try {
      const tx = await contract.postMessage(input);
      await tx.wait();
      loadMessages(contract);
      setInput("");
    } catch (err) {
      console.error("Publish error:", err);
    }
  }

  useEffect(() => {
    initContract();
  }, []);

  return (
    <div className="p-5">
      {!contract && (
        <button onClick={initContract} className="border px-3 py-1">
          Connect Wallet
        </button>
      )}

      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Write a message..."
        className="w-full border p-2 mt-3"
      />

      <button onClick={publishMessage} className="border px-3 py-1 mt-2">
        Publish
      </button>

      <h3 className="mt-4 font-bold">Messages on-chain:</h3>
      <ul className="mt-2 space-y-2">
        {messages.map((m, i) => (
          <li key={i} className="border p-2 rounded">
            <b>{m.from.slice(0,6)}...</b>: {m.text} <i className="text-sm">({m.time})</i>
          </li>
        ))}
      </ul>
    </div>
  );
}
