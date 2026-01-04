import { useState, useEffect } from "react";
import { ethers } from "ethers";

const contractAddress = "0x0b4447778f4FE94C5a1ad10D3a3b4Fd3509d2A4D";

const abi = [
  "event MessagePosted(address indexed user, string message, uint256 timestamp)",
  "function postMessage(string calldata _text) external payable",
  "function messages(uint256) view returns (address user, string text, uint256 timestamp)",
  "function getMessagesCount() external view returns (uint256)"
];

export default function MessageBoard() {
  const [contract, setContract] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Install wallet");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    if (network.chainId !== 8453n) {
      alert("Switch wallet to Base Mainnet");
      return;
    }

    const signer = await provider.getSigner();
    const c = new ethers.Contract(contractAddress, abi, signer);
    setContract(c);
    loadMessages(c);
  }

  async function loadMessages(c) {
    const count = await c.getMessagesCount();
    const arr = [];

    for (let i = 0; i < Number(count); i++) {
      const m = await c.messages(i);
      arr.push({
        from: m.user,
        text: m.text,
        time: new Date(Number(m.timestamp) * 1000).toLocaleString()
      });
    }

    setMessages(arr);
  }

  async function sendMessage() {
  if (!window.ethereum) {
    alert("Wallet not found");
    return;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const fee = ethers.parseEther("0.000005");

  try {
    const tx = await signer.sendTransaction({
      to: contractAddress,
      data: contract.interface.encodeFunctionData("postMessage", [message]),
      value: fee
    });

    await tx.wait();
    setMessage("");
    loadMessages(contract);
  } catch (err) {
    console.error("Publish error:", err);
    alert("Transaction failed");
  }
}
  useEffect(() => {
    if (!contract) return;
    contract.on("MessagePosted", () => loadMessages(contract));
    return () => contract.removeAllListeners();
  }, [contract]);

  return (
    <div style={{ padding: 20 }}>
      <button onClick={connectWallet}>Connect Wallet</button>

      <div style={{ marginTop: 20 }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message"
        />
        <button onClick={sendMessage}>Publish</button>
      </div>

      <ul>
        {messages.map((m, i) => (
          <li key={i}>
            <b>{m.from.slice(0,6)}...</b>: {m.text} ({m.time})
          </li>
        ))}
      </ul>
    </div>
  );
}
