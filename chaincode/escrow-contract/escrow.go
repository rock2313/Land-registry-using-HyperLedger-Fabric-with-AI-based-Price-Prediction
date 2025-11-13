// Escrow Smart Contract (Chaincode) in Go
// Deploy this on your Hyperledger Fabric network

package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// EscrowContract provides functions for managing escrow accounts
type EscrowContract struct {
	contractapi.Contract
}

// Escrow represents an escrow account
type Escrow struct {
	EscrowID        string    `json:"escrowId"`
	PropertyID      string    `json:"propertyId"`
	Buyer           string    `json:"buyer"`
	Seller          string    `json:"seller"`
	Amount          float64   `json:"amount"`
	Status          string    `json:"status"` // CREATED, FUNDED, RELEASED, CANCELLED
	TransactionHash string    `json:"transactionHash"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// CreateEscrow creates a new escrow account on the ledger
func (c *EscrowContract) CreateEscrow(ctx contractapi.TransactionContextInterface, escrowID string, propertyID string, buyer string, seller string, amount float64) error {
	exists, err := c.EscrowExists(ctx, escrowID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("escrow %s already exists", escrowID)
	}

	// Use transaction timestamp for deterministic behavior across all peers
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	escrow := Escrow{
		EscrowID:        escrowID,
		PropertyID:      propertyID,
		Buyer:           buyer,
		Seller:          seller,
		Amount:          amount,
		Status:          "CREATED",
		TransactionHash: "",
		CreatedAt:       timestamp,
		UpdatedAt:       timestamp,
	}

	escrowJSON, err := json.Marshal(escrow)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(escrowID, escrowJSON)
}

// GetEscrow retrieves an escrow account from the ledger
func (c *EscrowContract) GetEscrow(ctx contractapi.TransactionContextInterface, escrowID string) (*Escrow, error) {
	escrowJSON, err := ctx.GetStub().GetState(escrowID)
	if err != nil {
		return nil, fmt.Errorf("failed to read escrow: %v", err)
	}
	if escrowJSON == nil {
		return nil, fmt.Errorf("escrow %s does not exist", escrowID)
	}

	var escrow Escrow
	err = json.Unmarshal(escrowJSON, &escrow)
	if err != nil {
		return nil, err
	}

	return &escrow, nil
}

// FundEscrow marks an escrow as funded with a transaction hash
func (c *EscrowContract) FundEscrow(ctx contractapi.TransactionContextInterface, escrowID string, txHash string) error {
	escrow, err := c.GetEscrow(ctx, escrowID)
	if err != nil {
		return err
	}

	if escrow.Status != "CREATED" {
		return fmt.Errorf("escrow %s is not in CREATED status", escrowID)
	}

	// Use transaction timestamp for deterministic behavior
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	escrow.Status = "FUNDED"
	escrow.TransactionHash = txHash
	escrow.UpdatedAt = timestamp

	escrowJSON, err := json.Marshal(escrow)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(escrowID, escrowJSON)
}

// ReleaseEscrow releases funds to the seller
func (c *EscrowContract) ReleaseEscrow(ctx contractapi.TransactionContextInterface, escrowID string, releaseTxHash string) error {
	escrow, err := c.GetEscrow(ctx, escrowID)
	if err != nil {
		return err
	}

	if escrow.Status != "FUNDED" {
		return fmt.Errorf("escrow %s is not in FUNDED status", escrowID)
	}

	// Use transaction timestamp for deterministic behavior
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	escrow.Status = "RELEASED"
	escrow.TransactionHash = releaseTxHash
	escrow.UpdatedAt = timestamp

	escrowJSON, err := json.Marshal(escrow)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(escrowID, escrowJSON)
}

// CancelEscrow cancels an escrow and refunds the buyer
func (c *EscrowContract) CancelEscrow(ctx contractapi.TransactionContextInterface, escrowID string, refundTxHash string) error {
	escrow, err := c.GetEscrow(ctx, escrowID)
	if err != nil {
		return err
	}

	if escrow.Status == "RELEASED" {
		return fmt.Errorf("escrow %s has already been released", escrowID)
	}

	// Use transaction timestamp for deterministic behavior
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	escrow.Status = "CANCELLED"
	escrow.TransactionHash = refundTxHash
	escrow.UpdatedAt = timestamp

	escrowJSON, err := json.Marshal(escrow)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(escrowID, escrowJSON)
}

// EscrowExists checks if an escrow exists
func (c *EscrowContract) EscrowExists(ctx contractapi.TransactionContextInterface, escrowID string) (bool, error) {
	escrowJSON, err := ctx.GetStub().GetState(escrowID)
	if err != nil {
		return false, fmt.Errorf("failed to read escrow: %v", err)
	}

	return escrowJSON != nil, nil
}

// GetAllEscrows retrieves all escrow accounts
func (c *EscrowContract) GetAllEscrows(ctx contractapi.TransactionContextInterface) ([]*Escrow, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var escrows []*Escrow
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var escrow Escrow
		err = json.Unmarshal(queryResponse.Value, &escrow)
		if err != nil {
			return nil, err
		}
		escrows = append(escrows, &escrow)
	}

	return escrows, nil
}

// GetEscrowHistory retrieves the history of an escrow
func (c *EscrowContract) GetEscrowHistory(ctx contractapi.TransactionContextInterface, escrowID string) ([]map[string]interface{}, error) {
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(escrowID)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var history []map[string]interface{}
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var escrow Escrow
		if len(response.Value) > 0 {
			err = json.Unmarshal(response.Value, &escrow)
			if err != nil {
				return nil, err
			}
		}

		record := map[string]interface{}{
			"txId":      response.TxId,
			"timestamp": response.Timestamp,
			"escrow":    escrow,
			"isDelete":  response.IsDelete,
		}
		history = append(history, record)
	}

	return history, nil
}

func main() {
	escrowChaincode, err := contractapi.NewChaincode(&EscrowContract{})
	if err != nil {
		fmt.Printf("Error creating escrow chaincode: %v\n", err)
		return
	}

	if err := escrowChaincode.Start(); err != nil {
		fmt.Printf("Error starting escrow chaincode: %v\n", err)
	}
}