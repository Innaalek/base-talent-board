import { useState } from "react";
import { ethers } from "ethers";

const contractAddress = "0x2E1476Ba7D284e931389710904569FFdd1eC10F1";
const abi = [
  "function postMessage(string _text) public",
  "function getMessages() public view returns (string[])"
];

export default function MessageBoard() {
  const [message, setMessage] = useState("");

  async function publish() {
    if (!window.ethereum) return alert("Please connect MetaMask");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    const tx = await contract.postMessage(message);
    await tx.wait();
    alert("Message published on Base!");
  }

  return (
    <div className="p-4 grid gap-3">
      <h1 className="text-xl font-semibold">Base Message Board</h1>
      <textarea
        className="border rounded-2xl p-2 w-full min-h-[80px]"
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Write a message..."
      />
      <button
        onClick={publish}
        className="rounded-2xl bg-black text-white px-4 py-2"
      >
        Publish
      </button>
    </div>
  );
}
