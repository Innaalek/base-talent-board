import { useState, useEffect } from "react";
import { ethers } from "ethers";

const contractAddress = "0x0b4447778f4FE94C5a1ad10D3a3b4Fd3509d2A4D";

const abi = [
  "event MessagePosted(address indexed user, string message, uint256 timestamp)",
  "function postMessage(string calldata _text) external",
  "function getMessagesCount() external view returns (uint256)",
  "function getLatestMessage() external view returns (tuple(address user, string text, uint256 timestamp))"
];

export default function MessageBoard() {
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [message, setMessage] = useState("");
  const [lastMessage, setLastMessage] = useState(null);
  const [count, setCount] = useState(0);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Install MetaMask or Rabby first!");
      return;
    }

    const p = new ethers.BrowserProvider(window.ethereum);
    const network = await p.getNetwork();
    const chainId = network.chainId;

    // 8453 = Ethereum, 84532 = Base Sepolia, 8453 Hex = 0x2105
    if (chainId !== 8453) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x2105" }],
        });
      } catch (err) {
        alert("Switch to Base Mainnet in your wallet manually");
        return;
      }
    }

    const s = await p.getSigner();
    setProvider(p);
    setSigner(s);

    const c = new ethers.Contract(contractAddress, abi, s);
    setContract(c);
  }

  async function loadState() {
    if (!contract) return;

    const total = await contract.getMessagesCount();
    setCount(Number(total));

    try {
      const latest = await contract.getLatestMessage();
      setLastMessage({
        from: latest.user,
        text: latest.text,
        time: new Date(Number(latest.timestamp) * 1000).toLocaleString()
      });
    } catch {}
  }

  async function publishMessage() {
    if (!contract || !signer) {
      alert("Connect wallet first");
      return;
    }
    if (!message.trim()) return;

    try {
      const tx = await signer.sendTransaction({
        to: contractAddress,
        data: contract.interface.encodeFunctionData("postMessage", [message]),
        value: ethers.parseEther("0.000005")
      });

      await tx.wait();
      setMessage("");
      loadState();
    } catch (err) {
      console.error(err);
      alert("Transaction failed");
    }
  }

  useEffect(() => {
    if (contract) {
      loadState();
      contract.on("MessagePosted", (user, text, timestamp) => {
        setLastMessage({
          from: user,
          text,
          time: new Date(Number(timestamp) * 1000).toLocaleString()
        });
        setCount((prev) => prev + 1);
      });
    }
    return () => {
      if (contract) contract.removeAllListeners();
    };
  }, [contract]);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <button onClick={connectWallet}>Connect Wallet</button>

      <div style={{ marginTop: 20 }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message..."
          style={{ width: "100%", padding: 10 }}
        />
        <button onClick={publishMessage}>Publish</button>
      </div>

      <h3>Messages on-chain:</h3>
      <p><strong>Total messages:</strong> {count}</p>

      {lastMessage && (
        <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 6 }}>
          <strong>Last from:</strong> {lastMessage.from.slice(0,6)}...<br/>
          <strong>Message:</strong> {lastMessage.text}<br/>
          <strong>Time:</strong> {lastMessage.time}
        </div>
      )}
    </div>
  );
} 
