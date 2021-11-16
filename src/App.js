import { useState, useEffect } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import idl from './idl.json';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { getProvider, Program, Provider, web3 } from '@project-serum/anchor';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

// Test GIFS

const TEST_GIFS = [
  'https://media.giphy.com/media/9zXWAIcr6jycE/giphy.gif',
  'https://media.giphy.com/media/3Fdskc7J0timI/giphy.gif',
  'https://media.giphy.com/media/liBsVeLILcyaY/giphy.gif',
  'https://media.giphy.com/media/cgW5iwX0e37qg/giphy.gif',
  'https://media.giphy.com/media/8Ry7iAVwKBQpG/giphy.gif',
  'https://media.giphy.com/media/rOTGSPxvJJY7m/giphy.gif',
];

const { SystemProgram, Keypair } = web3;

let baseAccount = Keypair.generate();

const programID = new PublicKey(idl.metadata.address);

const network = clusterApiUrl('devnet');

const opts = {
  preflightCommitment: 'processed',
};

const App = () => {
  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  // Actions
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');

          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with public key: ',
            response.publicKey.toString()
          );
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet!');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const res = await solana.connect();
      console.log('Connected w/ Public Key: ', res.publicKey.toString());
      setWalletAddress(res.publicKey.toString());
    }
  };

  const sendGif = async () => {
    if (inputValue.length > 0) {
      console.log('Gif link:', inputValue);
    } else {
      console.log('Empty input. Try again.');
    }
  };

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const onInputChange = (e) => {
    const { value } = e.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection,
      window.solana,
      opts.preflightCommitment
    );

    return provider;
  };

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log('ping!');
      await program.rpc.initialize({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });

      console.log(
        'Created a new base account with address: ',
        baseAccount.publicKey.toString()
      );
      await getGifList();
    } catch (e) {
      console.log('Error initializing account: ', e);
    }
  };

  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button
            className="cta-button submit-gif-button"
            onClick={createGifAccount}
          >
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      );
    } else {
      return (
        <div className="connected-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <input
              type="text"
              placeholder="Enter gif link!"
              value={inputValue}
              onChange={onInputChange}
            />
            <button type="submit" className="cta-button submit-gif-button">
              Submit
            </button>
          </form>
          <div className="gif-grid">
            {gifList.map((gif) => (
              <div className="gif-item" key={gif}>
                <img src={gif} alt={gif} />
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );

      console.log('Got the account: ', account);

      setGifList(account.gifList);
    } catch (e) {
      console.log('Error in gifList: ', e);

      setGifList(null);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list....');
      getGifList();
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
