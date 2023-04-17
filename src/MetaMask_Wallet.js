import React, { useState } from "react";
import { ethers } from "ethers";
import {
  Container,Form,Navbar,Card,Stack,Button,Table,Row,Col,Spinner} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Ballot from "./contracts/Ballot.json";

const MetaMask_Wallet = () => {
  // metamask handling useStates
  const [errorMessage, setErrorMessage] = useState(null);
  const [defaultAccount, setDefaultAccount] = useState(null);
  const [userBalance, setUserBalance] = useState(null);
  const [connectButtonText, setConnectButtonText] = useState("Connect Wallet");
  const [isMetamaskConnected, setIsMetamaskConnected] = useState(false);
  const [contractAddress, setContractAddress] = useState(null);

  // ballot proposal form useStates
  const [ballotProposal, setBallotProposal] = useState("");
  const [isProposalFormTextValid, setIsProposalTextValid] = useState(false);
  const [isPropsalSubmitted, setIsProposalSubmitted] = useState(false);

  // candidate detail arrays useStates
  const [candidateNameArray, setCandidateNameArray] = useState([]);
  const [candidateAddressArray, setCandidateAddressArray] = useState([]);

  // candidate details useStates
  const [candidateName, setCandidateName] = useState("");
  const [candidateEthAddress, setCandidateEthAddress] = useState("");

  // canidate form validations useStates
  const [isCandidateFormTextValid, setIsCandidateFormTextValid] =
    useState(false);
  const [isCandidateFormAddressValid, setIsCandidateFormAddressValid] =
    useState(false);
  const [isCandidateFormSubmitted, setIsCandidateFormSubmitted] =
    useState(false);

  // deploying contract useState
  const [isContractDeployed, setIsContractDeployed] = useState(false);
  const [isContractSpinnerActive, setIsContractSpinnerActive] = useState(false);
  const [isDeployActive, setIsDeployActive] = useState(false);

  // table setup useStates
  const [table, setTable] = useState([]);
  const [officialBallotName, setOfficialBallotName] = useState(null);
  const [voteNumber, setVoteNumber] = useState("");
  const [isVoteSpinnerActive, setIsVoteSpinnerActive] = useState(false);
  const [isVoteActive, setIsVoteActive] = useState(false);

  // async methods
  const getCandidates = async (txAddress) => {
    try {
      console.log("Retrieving candidate information from deployed contract...");

      const currentAccount = defaultAccount;

      let factory;

      if (contractAddress) {
        const signer = new ethers.providers.Web3Provider(
          window.ethereum
        ).getSigner();
        factory = new ethers.Contract(contractAddress, Ballot.abi, signer);
      } else {
        const signer = new ethers.providers.Web3Provider(
          window.ethereum
        ).getSigner();
        factory = new ethers.Contract(txAddress, Ballot.abi, signer);
      }

      const tx = await factory.getCandidates();

      let tally = [];
      let obj = [];

      tx[1].forEach((element) => tally.push(element.toNumber()));

      tx[0].forEach((element) =>
        obj.push([element, tally[tx[0].indexOf(element)]])
      );

      setOfficialBallotName(tx[2]);
      setTable(obj);
      setVoteNumber("0");
      accountChangedHandler(currentAccount);
      console.log("...Successfully retrieved information");
    } catch (e) {
      console.log(e.message);
    }
  };

  const deploySmartContract = async () => {
    try {
      console.log("Deploying smart contract...");
      setIsDeployActive(true);

      let currentAccount = defaultAccount;

      const signer = new ethers.providers.Web3Provider(
        window.ethereum
      ).getSigner();
      let factory = new ethers.ContractFactory(
        Ballot.abi,
        Ballot.bytecode,
        signer
      );

      const contract = await factory.deploy(
        candidateNameArray,
        ballotProposal,
        candidateAddressArray
      );
      const startDate = new Date();

      setIsContractSpinnerActive(true);

      const tx = await contract.deployed();

      const endDate = new Date();
      const seconds = (endDate - startDate) / 1000;

      console.log(
        "...Deployment successful",
        "\n",
        "Contract Address: " + tx.address
      );

      console.log(
        "It took approximately " +
          seconds +
          " seconds to mine the contract on the goerli Testnet"
      );

      console.log(
        "Contract transaction hash: " + tx.deployTransaction.hash,
        "\n(Insert hash into the goerli Testnet Explorer at https://goerli.etherscan.io/ to view transaction details)"
      );

      setContractAddress(tx.address);
      accountChangedHandler(currentAccount);
      getCandidates(tx.address);
      setIsContractDeployed(true);
      setIsContractSpinnerActive(false);
    } catch (e) {
      setIsDeployActive(false);
      setIsContractSpinnerActive(false);
      console.log(e.message);
    }
  };

  const voteCandidate = async () => {
    try {
      console.log("Adding vote to smart contract...");
      setIsVoteActive(true);

      const currentAccount = defaultAccount;

      const signer = new ethers.providers.Web3Provider(
        window.ethereum
      ).getSigner();
      let factory = new ethers.Contract(contractAddress, Ballot.abi, signer);

      const tx = await factory.vote(parseInt(voteNumber));

      const startDate = new Date();

      setIsVoteSpinnerActive(true);

      const txLog = await tx.wait();

      const endDate = new Date();
      const seconds = (endDate - startDate) / 1000;

      console.log("...Vote successful.");

      console.log(
        "It took approximately " +
          seconds +
          " seconds to mine the vote on the deployed contract on the Goerli Testnet"
      );

      console.log(
        "Vote transaction hash: " + txLog.transactionHash,
        "\n(Insert hash into the goerli Testnet Explorer at https://goerli.etherscan.io/ to view transaction details)"
      );

      setIsVoteSpinnerActive(false);
      accountChangedHandler(currentAccount);
      getCandidates();
      setIsVoteActive(false);
    } catch (e) {
      setIsVoteActive(false);
      setIsVoteSpinnerActive(false);
      console.error(e.message);
      console.error("Ineligible Vote");
    }
  };

  // metamask methods
  const connectWalletHandler = () => {
    if (window.ethereum && window.ethereum.isMetaMask) {
      console.log("MetaMask Here!");
      setIsMetamaskConnected(true);

      window.ethereum
        .request({ method: "eth_requestAccounts" })
        .then((result) => {
          console.log("The active account is " + result[0]);
          accountChangedHandler(result[0]);
          setConnectButtonText("Wallet Connected to Metamask");
          getUserBalance(result[0]);
        })
        .catch((error) => {
          setErrorMessage(error.message);
        });
    } else {
      setIsMetamaskConnected(false);
      console.log("Need to install MetaMask browser extension");
      setErrorMessage(
        "Please install MetaMask browser extension to interact with page"
      );
    }
  };

  const accountChangedHandler = (newAccount) => {
    setDefaultAccount(newAccount);
    getUserBalance(newAccount.toString());
  };

  const getUserBalance = (address) => {
    window.ethereum
      .request({ method: "eth_getBalance", params: [address, "latest"] })
      .then((balance) => {
        setUserBalance(ethers.utils.formatEther(balance));
      });
  };

  const chainChangedHandler = () => {
    window.location.reload();
    connectWalletHandler();
  };

  // ballot form handlers
  const propsalTextHandler = (event) => {
    if (
      typeof event.target.value === "string" &&
      event.target.value &&
      event.target.value.trim().length !== 0
    ) {
      setBallotProposal(event.target.value);
      setIsProposalTextValid(true);
    } else {
      setBallotProposal(null);
      setIsProposalTextValid(false);
    }
  };

  const candidateTextHandler = (event) => {
    setCandidateName(event.target.value);

    if (typeof event.target.value === "string" && event.target.value) {
      let doesNameExist = false;

      if (candidateNameArray.length > 0) {
        for (let index = 0; index < candidateNameArray.length; index++) {
          if (
            event.target.value.toLowerCase().trim().replace(/\s\s+/g, " ") ===
            candidateNameArray[index]
              .toLowerCase()
              .trim()
              .replace(/\s\s+/g, " ")
          ) {
            console.error("Candidate name already exists in ballot!");
            doesNameExist = true;
          }
        }
      }

      if (!doesNameExist) {
        setIsCandidateFormTextValid(true);
      } else {
        setIsCandidateFormTextValid(false);
      }
    } else {
      console.error("Name input is NOT a valid input!");
      setIsCandidateFormTextValid(false);
    }
  };

  const candidateEthAddressHandler = (event) => {
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    const isEthValid = ethRegex.test(event.target.value);

    setCandidateEthAddress(event.target.value);

    if (isEthValid && event.target.value) {
      let doesEthAddressExist = false;

      if (candidateAddressArray.length > 0) {
        for (let index = 0; index < candidateAddressArray.length; index++) {
          if (
            event.target.value.toLowerCase() ===
            candidateAddressArray[index].toLowerCase()
          ) {
            console.error("Candidate address already exists in ballot!");
            doesEthAddressExist = true;
          }
        }
      }

      if (event.target.value.toLowerCase() === defaultAccount) {
        console.error("Candidate cannot have same address as chairman!");
        doesEthAddressExist = true;
      }

      if (!doesEthAddressExist) {
        setIsCandidateFormAddressValid(true);
      } else {
        setIsCandidateFormAddressValid(false);
      }
    } else {
      setIsCandidateFormAddressValid(false);
    }
  };

  const submitProposal = () => {
    console.log("Ballot Proposal Name: ", ballotProposal);
    setIsProposalSubmitted(true);
  };

  const submitCandidateName = () => {
    console.log("Submitting candidate names");
    setIsCandidateFormSubmitted(true);
  };

  const handleChange = (e) => {
    setVoteNumber(e.target.value);
  };

  const addCandidate = () => {
    const tempNameArray = candidateNameArray;
    const tempAddressArray = candidateAddressArray;

    tempNameArray.push(candidateName);
    setCandidateNameArray(tempNameArray);

    tempAddressArray.push(candidateEthAddress);
    setCandidateAddressArray(tempAddressArray);

    setCandidateName("");
    setCandidateEthAddress("");
    setIsCandidateFormAddressValid(false);
    setIsCandidateFormTextValid(false);
  };

  // metamask event handling
  window.ethereum.on("accountsChanged", accountChangedHandler);
  window.ethereum.on("chainChanged", chainChangedHandler);
  window.ethereum.removeListener("accountsChanged", accountChangedHandler);
  window.ethereum.removeListener("chainChanged", chainChangedHandler);

  return (
    <div className="Wallet">
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand href="#">E-Voting dApp</Navbar.Brand>
        </Container>
      </Navbar>

      <br />

      <Container>
        <Card bg="light" className="text-center">
          <Card.Header>MetaMask Wallet Connection</Card.Header>
          <Card.Body>
            <Card.Text>Account Address: {defaultAccount}</Card.Text>
            <Card.Text>Balance: {userBalance} </Card.Text>
            <Button variant="primary" onClick={connectWalletHandler}>
              {connectButtonText}
            </Button>
          </Card.Body>
        </Card>

        <br />

        {!isContractDeployed ? (
          <div>
            <Card bg="light" className="text-center">
              <Card.Header>Add Ballot Proposal</Card.Header>
              <Card.Body>
                {!isPropsalSubmitted ? (
                  <div>
                    <Stack direction="horizontal" gap={3}>
                      <Form.Control
                        type="text"
                        className="proposal"
                        placeholder="Add proposal name here..."
                        onChange={propsalTextHandler}
                        disabled={!isMetamaskConnected}
                      />
                      <Button
                        variant="success"
                        disabled={!isProposalFormTextValid}
                        onClick={submitProposal}
                      >
                        Submit
                      </Button>{" "}
                    </Stack>
                  </div>
                ) : (
                  ballotProposal
                )}
              </Card.Body>
            </Card>

            <br />

            <Card bg="light" className="text-center">
              <Card.Header>Add Candidates</Card.Header>
              <Card.Body>
                {!isCandidateFormSubmitted ? (
                  <Stack direction="horizontal" gap={3}>
                    <Form.Control
                      type="text"
                      placeholder="Add candidate's name here..."
                      onChange={candidateTextHandler}
                      value={candidateName}
                      disabled={!isPropsalSubmitted}
                    />

                    <Form.Control
                      type="text"
                      placeholder="Add candidate's address here..."
                      onChange={candidateEthAddressHandler}
                      value={candidateEthAddress}
                      disabled={!isPropsalSubmitted}
                    />

                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={
                        !isCandidateFormAddressValid ||
                        !isCandidateFormTextValid
                      }
                      onClick={addCandidate}
                    >
                      Add
                    </Button>
                    <Button
                      variant="success"
                      disabled={candidateNameArray.length <= 1}
                      onClick={submitCandidateName}
                    >
                      Submit
                    </Button>
                    <br />
                  </Stack>
                ) : (
                  <div></div>
                )}

                <Container>
                  <Row>
                    <Col>
                      {candidateNameArray.map((element, index) => {
                        return (
                          <Card.Text key={index} value={index}>
                            {element}
                          </Card.Text>
                        );
                      })}
                    </Col>

                    <Col>
                      {candidateAddressArray.map((element, index) => {
                        return (
                          <Card.Text key={index} value={index}>
                            {element}
                          </Card.Text>
                        );
                      })}
                    </Col>
                  </Row>
                </Container>
              </Card.Body>
            </Card>

            <br />

            <div className="text-center">
              <Button
                onClick={deploySmartContract}
                variant="warning"
                disabled={!isCandidateFormSubmitted || isDeployActive}
              >
                {!isContractSpinnerActive ? (
                  <div>Deploy Smart Contract on goerli Testnet</div>
                ) : (
                  <div>
                    <Spinner animation="border" />
                    <div> Mining Contract....</div>
                  </div>
                )}
              </Button>{" "}
            </div>
          </div>
        ) : (
          <div>
            <Card bg="light" className="text-center">
              <Card.Header>Official Ballot</Card.Header>
              <br />
              <div className="text-center">
                Goerli Contract Address: {contractAddress}
              </div>
              <div className="text-center">
                Official Ballot Name: {officialBallotName}
              </div>
              <br />

              <div className="text-center">
                <Table
                  className="center"
                  striped
                  bordered
                  hover
                  style={{ width: 400 }}
                >
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Candidate</th>
                      <th>Vote Tally</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((element, index) => {
                      return (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{element[0]}</td>
                          <td>{element[1]}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>

              <div>
                <Form.Select
                  value={voteNumber}
                  onChange={(e) => handleChange(e)}
                >
                  {table.map((element, index) => {
                    return (
                      <option key={index} value={index}>
                        {element[0]}
                      </option>
                    );
                  })}
                </Form.Select>
              </div>

              <br />

              <div>
                <Button
                  variant="success"
                  onClick={voteCandidate}
                  disabled={isVoteActive}
                >
                  {!isVoteSpinnerActive ? (
                    <div>Vote</div>
                  ) : (
                    <div>
                      <Spinner animation="border" />
                      <div> Mining Vote....</div>
                    </div>
                  )}
                </Button>{" "}
              </div>

              <br />
            </Card>
          </div>
        )}

        {errorMessage}
      </Container>
      <br />
    </div>
  );
};

export default MetaMask_Wallet;
