package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type PropertyContract struct {
	contractapi.Contract
}

// Property represents a land property with enhanced fields
type Property struct {
	PropertyID       string    `json:"propertyId"`
	Owner            string    `json:"owner"`
	OwnerName        string    `json:"ownerName"`
	Location         string    `json:"location"`
	Area             float64   `json:"area"`
	Price            float64   `json:"price"`
	Status           string    `json:"status"` // AVAILABLE, PENDING_VERIFICATION, VERIFIED, UNDER_CONTRACT, SOLD
	PropertyType     string    `json:"propertyType"` // RESIDENTIAL, COMMERCIAL, AGRICULTURAL
	Description      string    `json:"description"`
	Documents        []string  `json:"documents"`
	VerifiedBy       string    `json:"verifiedBy"`
	VerifiedAt       time.Time `json:"verifiedAt"`
	RegisteredAt     time.Time `json:"registeredAt"`
	LastUpdated      time.Time `json:"lastUpdated"`
	Views            int       `json:"views"`
	Latitude         float64   `json:"latitude"`
	Longitude        float64   `json:"longitude"`
}

// User represents a system user
type User struct {
	UserID        string    `json:"userId"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	Role          string    `json:"role"` // BUYER, SELLER, VERIFIER, ADMIN
	WalletAddress string    `json:"walletAddress"`
	Phone         string    `json:"phone"`
	IsVerified    bool      `json:"isVerified"`
	RegisteredAt  time.Time `json:"registeredAt"`
	LastLogin     time.Time `json:"lastLogin"`
}

// Transaction represents a property transaction
type Transaction struct {
	TransactionID string    `json:"transactionId"`
	PropertyID    string    `json:"propertyId"`
	FromOwner     string    `json:"fromOwner"`
	ToOwner       string    `json:"toOwner"`
	Amount        float64   `json:"amount"`
	Status        string    `json:"status"` // PENDING, COMPLETED, CANCELLED
	EscrowID      string    `json:"escrowId"`
	Timestamp     time.Time `json:"timestamp"`
}

// ============= User Management =============

func (c *PropertyContract) RegisterUser(ctx contractapi.TransactionContextInterface, userID string, name string, email string, role string, walletAddress string, phone string) error {
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
		Role:          role,
		WalletAddress: walletAddress,
		Phone:         phone,
		IsVerified:    false,
		RegisteredAt:  timestamp,
		LastLogin:     timestamp,
	}

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("USER_"+userID, userJSON)
}

func (c *PropertyContract) GetUser(ctx contractapi.TransactionContextInterface, userID string) (*User, error) {
	userJSON, err := ctx.GetStub().GetState("USER_" + userID)
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

func (c *PropertyContract) UpdateUserVerification(ctx contractapi.TransactionContextInterface, userID string, isVerified bool) error {
	user, err := c.GetUser(ctx, userID)
	if err != nil {
		return err
	}

	user.IsVerified = isVerified

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("USER_"+userID, userJSON)
}

func (c *PropertyContract) UserExists(ctx contractapi.TransactionContextInterface, userID string) (bool, error) {
	userJSON, err := ctx.GetStub().GetState("USER_" + userID)
	if err != nil {
		return false, fmt.Errorf("failed to read user: %v", err)
	}
	return userJSON != nil, nil
}

// ============= Enhanced Property Management =============

func (c *PropertyContract) RegisterProperty(ctx contractapi.TransactionContextInterface, propertyID string, owner string, ownerName string, location string, area float64, price float64, propertyType string, description string, latitude float64, longitude float64) error {
	exists, err := c.PropertyExists(ctx, propertyID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("property %s already exists", propertyID)
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	property := Property{
		PropertyID:   propertyID,
		Owner:        owner,
		OwnerName:    ownerName,
		Location:     location,
		Area:         area,
		Price:        price,
		Status:       "PENDING_VERIFICATION",
		PropertyType: propertyType,
		Description:  description,
		Documents:    []string{},
		VerifiedBy:   "",
		RegisteredAt: timestamp,
		LastUpdated:  timestamp,
		Views:        0,
		Latitude:     latitude,
		Longitude:    longitude,
	}

	propertyJSON, err := json.Marshal(property)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(propertyID, propertyJSON)
}

func (c *PropertyContract) VerifyProperty(ctx contractapi.TransactionContextInterface, propertyID string, verifierID string) error {
	property, err := c.GetProperty(ctx, propertyID)
	if err != nil {
		return err
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	property.Status = "VERIFIED"
	property.VerifiedBy = verifierID
	property.VerifiedAt = timestamp
	property.LastUpdated = timestamp

	propertyJSON, err := json.Marshal(property)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(propertyID, propertyJSON)
}

func (c *PropertyContract) UpdatePropertyPrice(ctx contractapi.TransactionContextInterface, propertyID string, price float64) error {
	property, err := c.GetProperty(ctx, propertyID)
	if err != nil {
		return err
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	property.Price = price
	property.LastUpdated = timestamp

	propertyJSON, err := json.Marshal(property)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(propertyID, propertyJSON)
}

func (c *PropertyContract) IncrementPropertyViews(ctx contractapi.TransactionContextInterface, propertyID string) error {
	property, err := c.GetProperty(ctx, propertyID)
	if err != nil {
		return err
	}

	property.Views++

	propertyJSON, err := json.Marshal(property)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(propertyID, propertyJSON)
}

func (c *PropertyContract) GetProperty(ctx contractapi.TransactionContextInterface, propertyID string) (*Property, error) {
	propertyJSON, err := ctx.GetStub().GetState(propertyID)
	if err != nil {
		return nil, fmt.Errorf("failed to read property: %v", err)
	}
	if propertyJSON == nil {
		return nil, fmt.Errorf("property %s does not exist", propertyID)
	}

	var property Property
	err = json.Unmarshal(propertyJSON, &property)
	if err != nil {
		return nil, err
	}

	return &property, nil
}

func (c *PropertyContract) GetPropertiesByStatus(ctx contractapi.TransactionContextInterface, status string) ([]*Property, error) {
	queryString := fmt.Sprintf(`{"selector":{"status":"%s"}}`, status)
	return c.queryProperties(ctx, queryString)
}

func (c *PropertyContract) GetPropertiesByType(ctx contractapi.TransactionContextInterface, propertyType string) ([]*Property, error) {
	queryString := fmt.Sprintf(`{"selector":{"propertyType":"%s"}}`, propertyType)
	return c.queryProperties(ctx, queryString)
}

func (c *PropertyContract) GetPropertiesByOwner(ctx contractapi.TransactionContextInterface, owner string) ([]*Property, error) {
	queryString := fmt.Sprintf(`{"selector":{"owner":"%s"}}`, owner)
	return c.queryProperties(ctx, queryString)
}

func (c *PropertyContract) queryProperties(ctx contractapi.TransactionContextInterface, queryString string) ([]*Property, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var properties []*Property
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var property Property
		err = json.Unmarshal(queryResponse.Value, &property)
		if err != nil {
			continue
		}
		properties = append(properties, &property)
	}

	return properties, nil
}

func (c *PropertyContract) GetAllProperties(ctx contractapi.TransactionContextInterface) ([]*Property, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var properties []*Property
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var property Property
		err = json.Unmarshal(queryResponse.Value, &property)
		if err != nil {
			continue
		}
		properties = append(properties, &property)
	}

	return properties, nil
}

func (c *PropertyContract) TransferProperty(ctx contractapi.TransactionContextInterface, propertyID string, newOwner string, newOwnerName string, transactionID string) error {
	property, err := c.GetProperty(ctx, propertyID)
	if err != nil {
		return err
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	oldOwner := property.Owner
	property.Owner = newOwner
	property.OwnerName = newOwnerName
	property.Status = "SOLD"
	property.LastUpdated = timestamp

	propertyJSON, err := json.Marshal(property)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(propertyID, propertyJSON)
	if err != nil {
		return err
	}

	// Create transaction record
	transaction := Transaction{
		TransactionID: transactionID,
		PropertyID:    propertyID,
		FromOwner:     oldOwner,
		ToOwner:       newOwner,
		Amount:        property.Price,
		Status:        "COMPLETED",
		Timestamp:     timestamp,
	}

	transactionJSON, err := json.Marshal(transaction)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("TXN_"+transactionID, transactionJSON)
}

func (c *PropertyContract) UpdatePropertyStatus(ctx contractapi.TransactionContextInterface, propertyID string, status string) error {
	property, err := c.GetProperty(ctx, propertyID)
	if err != nil {
		return err
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	property.Status = status
	property.LastUpdated = timestamp

	propertyJSON, err := json.Marshal(property)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(propertyID, propertyJSON)
}

func (c *PropertyContract) PropertyExists(ctx contractapi.TransactionContextInterface, propertyID string) (bool, error) {
	propertyJSON, err := ctx.GetStub().GetState(propertyID)
	if err != nil {
		return false, fmt.Errorf("failed to read property: %v", err)
	}
	return propertyJSON != nil, nil
}

func (c *PropertyContract) GetPropertyHistory(ctx contractapi.TransactionContextInterface, propertyID string) ([]map[string]interface{}, error) {
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(propertyID)
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

		var property Property
		if len(response.Value) > 0 {
			err = json.Unmarshal(response.Value, &property)
			if err != nil {
				return nil, err
			}
		}

		record := map[string]interface{}{
			"txId":      response.TxId,
			"timestamp": response.Timestamp,
			"property":  property,
			"isDelete":  response.IsDelete,
		}
		history = append(history, record)
	}

	return history, nil
}

func main() {
	propertyChaincode, err := contractapi.NewChaincode(&PropertyContract{})
	if err != nil {
		fmt.Printf("Error creating property chaincode: %v\n", err)
		return
	}

	if err := propertyChaincode.Start(); err != nil {
		fmt.Printf("Error starting property chaincode: %v\n", err)
	}
}