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
      }, 180000);
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
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch block number:", error);
    }
  }

  async function fetchPageBlocks() {
    if (currentBlockNumber) {
      setIsLoading(true);
      let blocks = [];
      let startBlockCount = currentPage * 10 - 10;
      let endBlockCount = currentPage * 10;
      for (let i = startBlockCount; i < endBlockCount; i++) {
        try {
          const block = await alchemy.core.getBlockWithTransactions(
            currentBlockNumber - i,
            true
          );
          block.isExpanded = false;
          block.transactions = block.transactions.map((tx) => ({
            ...tx,
            gasPrice: tx.gasPrice ? tx.gasPrice.toString() : "N/A",
            maxPriorityFeePerGas: tx.maxPriorityFeePerGas
              ? tx.maxPriorityFeePerGas.toString()
              : "N/A",
            maxFeePerGas: tx.maxFeePerGas ? tx.maxFeePerGas.toString() : "N/A",
            gasLimit: tx.gasLimit ? tx.gasLimit.toString() : "N/A",
            value: tx.value ? tx.value.toString() : "N/A",
            isExpanded: false,
          }));
          blocks.push(block);
        } catch (error) {
          console.error("Error fetching block data:", error);
        }
      }
      setCurrentPageBlocks(blocks);
      setIsLoading(false);
    }
  }

  function toggleBlockExpand(index) {
    const newBlocks = [...currentPageBlocks];
    newBlocks[index].isExpanded = !newBlocks[index].isExpanded;
    setCurrentPageBlocks(newBlocks);
  }

  function toggleTransactionExpand(blockIndex, txIndex) {
    const newBlocks = [...currentPageBlocks];
    newBlocks[blockIndex].transactions[txIndex].isExpanded =
      !newBlocks[blockIndex].transactions[txIndex].isExpanded;
    setCurrentPageBlocks(newBlocks);
  }

  function nextPage() {
    setIsLoading(true);
    const newPage = currentPage + 1;
    const maxPage = Math.ceil(currentBlockNumber / 10);
    if (newPage <= maxPage) {
      setCurrentPage(newPage);
    }
    setIsLoading(false);
  }

  function previousPage() {
    setIsLoading(true);
    const newPage = currentPage - 1;
    if (newPage > 0) {
      setCurrentPage(newPage);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    fetchCurrentBlockNumber();
    startCurrentBlockNumberPolling();
    return () => stopCurrentBlockNumberPolling();
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
    <div className="App non-selectable">
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
          currentPageBlocks.map((block, blockIndex) => (
            <div
              key={blockIndex}
              className="expandable"
              onClick={() => toggleBlockExpand(blockIndex)}
            >
              <h2>Block Number: {block.number} (Click to expand)</h2>
              {block.isExpanded && (
                <div>
                  <p>Hash: {block.hash}</p>
                  <p>Parent Hash: {block.parentHash}</p>
                  <p>
                    Timestamp:{" "}
                    {new Date(block.timestamp * 1000).toLocaleString()}
                  </p>
                  <p>Transactions: {block.transactions.length}</p>
                  {block.transactions.map((tx, txIndex) => (
                    <div
                      key={txIndex}
                      className="expandable"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTransactionExpand(blockIndex, txIndex);
                      }}
                    >
                      <p>Transaction Hash: {`${tx.hash.substring(0,16)}...`} (Click to expand)</p>
                      {tx.isExpanded && (
                        <div>
                          <p>From: {tx.from}</p>
                          <p>To: {tx.to}</p>
                          <p>Value: {tx.value} wei</p>
                          <p>Gas: {tx.gasLimit}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {blockIndex < currentPageBlocks.length - 1 && <hr />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
