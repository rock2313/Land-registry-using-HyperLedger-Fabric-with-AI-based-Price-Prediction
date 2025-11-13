package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// UserContract provides functions for managing users
type UserContract struct {
	contractapi.Contract
}

// User represents a system user with credentials and documents stored on ledger
type User struct {
	UserID        string    `json:"userId"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	Phone         string    `json:"phone"`
	Aadhar        string    `json:"aadhar"`
	PAN           string    `json:"pan"`
	Address       string    `json:"address"`
	Role          string    `json:"role"` // BUYER, SELLER, ADMIN
	WalletAddress string    `json:"walletAddress"`
	Documents     []Document `json:"documents"`
	PasswordHash  string    `json:"passwordHash"`
	IsVerified    bool      `json:"isVerified"`
	RegisteredAt  time.Time `json:"registeredAt"`
	LastLogin     time.Time `json:"lastLogin"`
}

// Document represents a user document stored on the ledger
type Document struct {
	DocumentID   string    `json:"documentId"`
	DocumentType string    `json:"documentType"` // AADHAR, PAN, PROPERTY_DEED, etc.
	DocumentHash string    `json:"documentHash"` // IPFS hash or base64 encoded
	UploadedAt   time.Time `json:"uploadedAt"`
	VerifiedBy   string    `json:"verifiedBy"`
	IsVerified   bool      `json:"isVerified"`
}

// RegisterUser creates a new user on the ledger with credentials and documents
func (c *UserContract) RegisterUser(ctx contractapi.TransactionContextInterface, userID string, name string, email string, phone string, aadhar string, pan string, address string, role string, walletAddress string, passwordHash string) error {
	exists, err := c.UserExists(ctx, userID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("user %s already exists", userID)
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	user := User{
		UserID:        userID,
		Name:          name,
		Email:         email,
		Phone:         phone,
		Aadhar:        aadhar,
		PAN:           pan,
		Address:       address,
		Role:          role,
		WalletAddress: walletAddress,
		Documents:     []Document{},
		PasswordHash:  passwordHash,
		IsVerified:    false,
		RegisteredAt:  timestamp,
		LastLogin:     timestamp,
	}

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(userID, userJSON)
}

// GetUser retrieves a user from the ledger
func (c *UserContract) GetUser(ctx contractapi.TransactionContextInterface, userID string) (*User, error) {
	userJSON, err := ctx.GetStub().GetState(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to read user: %v", err)
	}
	if userJSON == nil {
		return nil, fmt.Errorf("user %s does not exist", userID)
	}

	var user User
	err = json.Unmarshal(userJSON, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// UpdateUserVerification updates user verification status
func (c *UserContract) UpdateUserVerification(ctx contractapi.TransactionContextInterface, userID string, isVerified bool) error {
	user, err := c.GetUser(ctx, userID)
	if err != nil {
		return err
	}

	user.IsVerified = isVerified

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(userID, userJSON)
}

// AddDocument adds a document to a user's profile
func (c *UserContract) AddDocument(ctx contractapi.TransactionContextInterface, userID string, documentID string, documentType string, documentHash string) error {
	user, err := c.GetUser(ctx, userID)
	if err != nil {
		return err
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	document := Document{
		DocumentID:   documentID,
		DocumentType: documentType,
		DocumentHash: documentHash,
		UploadedAt:   timestamp,
		VerifiedBy:   "",
		IsVerified:   false,
	}

	user.Documents = append(user.Documents, document)

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(userID, userJSON)
}

// VerifyDocument marks a document as verified by an admin
func (c *UserContract) VerifyDocument(ctx contractapi.TransactionContextInterface, userID string, documentID string, adminID string) error {
	user, err := c.GetUser(ctx, userID)
	if err != nil {
		return err
	}

	found := false
	for i, doc := range user.Documents {
		if doc.DocumentID == documentID {
			user.Documents[i].IsVerified = true
			user.Documents[i].VerifiedBy = adminID
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("document %s not found for user %s", documentID, userID)
	}

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(userID, userJSON)
}

// UpdateLastLogin updates user's last login timestamp
func (c *UserContract) UpdateLastLogin(ctx contractapi.TransactionContextInterface, userID string) error {
	user, err := c.GetUser(ctx, userID)
	if err != nil {
		return err
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	user.LastLogin = timestamp

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(userID, userJSON)
}

// UserExists checks if a user exists
func (c *UserContract) UserExists(ctx contractapi.TransactionContextInterface, userID string) (bool, error) {
	userJSON, err := ctx.GetStub().GetState(userID)
	if err != nil {
		return false, fmt.Errorf("failed to read user: %v", err)
	}
	return userJSON != nil, nil
}

// GetUsersByRole retrieves all users with a specific role
func (c *UserContract) GetUsersByRole(ctx contractapi.TransactionContextInterface, role string) ([]*User, error) {
	queryString := fmt.Sprintf(`{"selector":{"role":"%s"}}`, role)
	return c.queryUsers(ctx, queryString)
}

// GetAllUsers retrieves all users
func (c *UserContract) GetAllUsers(ctx contractapi.TransactionContextInterface) ([]*User, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var users []*User
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var user User
		err = json.Unmarshal(queryResponse.Value, &user)
		if err != nil {
			continue
		}
		users = append(users, &user)
	}

	return users, nil
}

// queryUsers - helper function for querying users
func (c *UserContract) queryUsers(ctx contractapi.TransactionContextInterface, queryString string) ([]*User, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var users []*User
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var user User
		err = json.Unmarshal(queryResponse.Value, &user)
		if err != nil {
			continue
		}
		users = append(users, &user)
	}

	return users, nil
}

func main() {
	userChaincode, err := contractapi.NewChaincode(&UserContract{})
	if err != nil {
		fmt.Printf("Error creating user chaincode: %v\n", err)
		return
	}

	if err := userChaincode.Start(); err != nil {
		fmt.Printf("Error starting user chaincode: %v\n", err)
	}
}
