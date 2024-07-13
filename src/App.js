/* eslint-disable react-hooks/exhaustive-deps */
import { Alchemy, Network } from "alchemy-sdk";
import { useEffect, useState } from "react";
import "./App.css";

const settings = {
  apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(settings);
let interval;

function App() {
  const [currentBlockNumber, setBlockNumber] = useState(0);
  const [currentPageBlocks, setCurrentPageBlocks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  function startCurrentBlockNumberPolling() {
    if (!interval) {
      interval = setInterval(() => {
        fetchCurrentBlockNumber();
      }, 12000);
    }
  }

  function stopCurrentBlockNumberPolling() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  async function fetchCurrentBlockNumber() {
    try {
      setIsLoading(true);
      const blockNumber = await alchemy.core.getBlockNumber();
      setBlockNumber(blockNumber);
    } catch (error) {
      console.error("Failed to fetch block number:", error);
    }
  }

  async function fetchPageBlocks() {
    if (currentBlockNumber) {
      let blocks = [];
      let startBlockCount = currentPage * 10 - 10;
      let endBlockCount = currentPage * 10;
      for (let i = startBlockCount; i < endBlockCount; i++) {
        const block = await alchemy.core.getBlock(currentBlockNumber - i);
        blocks.push(block);
      }
      setCurrentPageBlocks(blocks);
      setIsLoading(false);
    }
  }

  function nextPage() {
    setIsLoading(true);
    const newPage = currentPage + 1;
    const maxPage = Math.ceil(currentBlockNumber / 10);
    if (newPage <= maxPage) {
      setCurrentPage(newPage);
    }
  }

  function previousPage() {
    setIsLoading(true);
    const newPage = currentPage - 1;
    if (newPage > 0) {
      setCurrentPage(newPage);
    }
  }

  useEffect(() => {
    fetchCurrentBlockNumber();
    startCurrentBlockNumberPolling();
    return stopCurrentBlockNumberPolling;
  }, []);

  useEffect(() => {
    fetchPageBlocks();
    if (currentPage === 1) {
      if (!interval) {
        startCurrentBlockNumberPolling();
      }
    } else {
      stopCurrentBlockNumberPolling();
    }
  }, [currentBlockNumber, currentPage]);

  return (
    <div className="App">
      <button onClick={previousPage} disabled={isLoading || currentPage === 1}>
        Previous
      </button>
      <h1>{currentPage}</h1>
      <button
        onClick={nextPage}
        disabled={
          isLoading || currentPage >= Math.ceil(currentBlockNumber / 10)
        }
      >
        Next
      </button>
      <div>
        {isLoading ? (
          <h2>Loading...</h2>
        ) : (
          currentPageBlocks.map((block, index) => (
            <div key={index}>
              <h2>Block Number: {block.number}</h2>
              <p>Hash: {block.hash}</p>
              <p>Parent Hash: {block.parentHash}</p>
              <p>Timestamp: {block.timestamp}</p>
              <p>Transactions: {block.transactions.length}</p>
              {index < currentPageBlocks.length - 1 && <hr />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
