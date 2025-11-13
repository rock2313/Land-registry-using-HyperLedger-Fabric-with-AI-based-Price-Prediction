package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// OfferContract provides functions for managing offers
type OfferContract struct {
	contractapi.Contract
}

// Offer represents a property purchase offer
type Offer struct {
	OfferID        string    `json:"offerId"`
	PropertyID     string    `json:"propertyId"`
	BuyerID        string    `json:"buyerId"`
	BuyerName      string    `json:"buyerName"`
	SellerID       string    `json:"sellerId"`
	SellerName     string    `json:"sellerName"`
	OfferAmount    float64   `json:"offerAmount"`
	Status         string    `json:"status"` // PENDING, ACCEPTED, REJECTED, ADMIN_VERIFIED, COMPLETED, CANCELLED
	Message        string    `json:"message"`
	AdminVerified  bool      `json:"adminVerified"`
	AdminID        string    `json:"adminId"`
	VerifiedAt     time.Time `json:"verifiedAt"`
	SepoliaTxHash  string    `json:"sepoliaTxHash"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// CreateOffer creates a new property purchase offer
func (c *OfferContract) CreateOffer(ctx contractapi.TransactionContextInterface, offerID string, propertyID string, buyerID string, buyerName string, sellerID string, sellerName string, offerAmount float64, message string) error {
	exists, err := c.OfferExists(ctx, offerID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("offer %s already exists", offerID)
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	offer := Offer{
		OfferID:       offerID,
		PropertyID:    propertyID,
		BuyerID:       buyerID,
		BuyerName:     buyerName,
		SellerID:      sellerID,
		SellerName:    sellerName,
		OfferAmount:   offerAmount,
		Status:        "PENDING",
		Message:       message,
		AdminVerified: false,
		AdminID:       "",
		SepoliaTxHash: "",
		CreatedAt:     timestamp,
		UpdatedAt:     timestamp,
	}

	offerJSON, err := json.Marshal(offer)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(offerID, offerJSON)
}

// GetOffer retrieves an offer from the ledger
func (c *OfferContract) GetOffer(ctx contractapi.TransactionContextInterface, offerID string) (*Offer, error) {
	offerJSON, err := ctx.GetStub().GetState(offerID)
	if err != nil {
		return nil, fmt.Errorf("failed to read offer: %v", err)
	}
	if offerJSON == nil {
		return nil, fmt.Errorf("offer %s does not exist", offerID)
	}

	var offer Offer
	err = json.Unmarshal(offerJSON, &offer)
	if err != nil {
		return nil, err
	}

	return &offer, nil
}

// AcceptOffer - seller accepts the buyer's offer
func (c *OfferContract) AcceptOffer(ctx contractapi.TransactionContextInterface, offerID string) error {
	offer, err := c.GetOffer(ctx, offerID)
	if err != nil {
		return err
	}

	if offer.Status != "PENDING" {
		return fmt.Errorf("offer %s is not in PENDING status", offerID)
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	offer.Status = "ACCEPTED"
	offer.UpdatedAt = timestamp

	offerJSON, err := json.Marshal(offer)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(offerID, offerJSON)
}

// RejectOffer - seller rejects the buyer's offer
func (c *OfferContract) RejectOffer(ctx contractapi.TransactionContextInterface, offerID string) error {
	offer, err := c.GetOffer(ctx, offerID)
	if err != nil {
		return err
	}

	if offer.Status != "PENDING" {
		return fmt.Errorf("offer %s is not in PENDING status", offerID)
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	offer.Status = "REJECTED"
	offer.UpdatedAt = timestamp

	offerJSON, err := json.Marshal(offer)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(offerID, offerJSON)
}

// AdminVerifyOffer - admin verifies and approves the transaction
func (c *OfferContract) AdminVerifyOffer(ctx contractapi.TransactionContextInterface, offerID string, adminID string, sepoliaTxHash string) error {
	offer, err := c.GetOffer(ctx, offerID)
	if err != nil {
		return err
	}

	if offer.Status != "ACCEPTED" {
		return fmt.Errorf("offer %s must be ACCEPTED before admin verification", offerID)
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	offer.Status = "ADMIN_VERIFIED"
	offer.AdminVerified = true
	offer.AdminID = adminID
	offer.VerifiedAt = timestamp
	offer.SepoliaTxHash = sepoliaTxHash
	offer.UpdatedAt = timestamp

	offerJSON, err := json.Marshal(offer)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(offerID, offerJSON)
}

// CompleteOffer - marks offer as completed after land transfer
func (c *OfferContract) CompleteOffer(ctx contractapi.TransactionContextInterface, offerID string) error {
	offer, err := c.GetOffer(ctx, offerID)
	if err != nil {
		return err
	}

	if offer.Status != "ADMIN_VERIFIED" {
		return fmt.Errorf("offer %s must be ADMIN_VERIFIED before completion", offerID)
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	offer.Status = "COMPLETED"
	offer.UpdatedAt = timestamp

	offerJSON, err := json.Marshal(offer)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(offerID, offerJSON)
}

// CancelOffer - cancels an offer
func (c *OfferContract) CancelOffer(ctx contractapi.TransactionContextInterface, offerID string) error {
	offer, err := c.GetOffer(ctx, offerID)
	if err != nil {
		return err
	}

	if offer.Status == "COMPLETED" {
		return fmt.Errorf("cannot cancel completed offer %s", offerID)
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos))

	offer.Status = "CANCELLED"
	offer.UpdatedAt = timestamp

	offerJSON, err := json.Marshal(offer)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(offerID, offerJSON)
}

// OfferExists checks if an offer exists
func (c *OfferContract) OfferExists(ctx contractapi.TransactionContextInterface, offerID string) (bool, error) {
	offerJSON, err := ctx.GetStub().GetState(offerID)
	if err != nil {
		return false, fmt.Errorf("failed to read offer: %v", err)
	}

	return offerJSON != nil, nil
}

// GetOffersByProperty retrieves all offers for a property
func (c *OfferContract) GetOffersByProperty(ctx contractapi.TransactionContextInterface, propertyID string) ([]*Offer, error) {
	queryString := fmt.Sprintf(`{"selector":{"propertyId":"%s"}}`, propertyID)
	return c.queryOffers(ctx, queryString)
}

// GetOffersByBuyer retrieves all offers made by a buyer
func (c *OfferContract) GetOffersByBuyer(ctx contractapi.TransactionContextInterface, buyerID string) ([]*Offer, error) {
	queryString := fmt.Sprintf(`{"selector":{"buyerId":"%s"}}`, buyerID)
	return c.queryOffers(ctx, queryString)
}

// GetOffersBySeller retrieves all offers received by a seller
func (c *OfferContract) GetOffersBySeller(ctx contractapi.TransactionContextInterface, sellerID string) ([]*Offer, error) {
	queryString := fmt.Sprintf(`{"selector":{"sellerId":"%s"}}`, sellerID)
	return c.queryOffers(ctx, queryString)
}

// GetOffersByStatus retrieves all offers with a specific status
func (c *OfferContract) GetOffersByStatus(ctx contractapi.TransactionContextInterface, status string) ([]*Offer, error) {
	queryString := fmt.Sprintf(`{"selector":{"status":"%s"}}`, status)
	return c.queryOffers(ctx, queryString)
}

// GetPendingAdminVerifications retrieves all offers waiting for admin verification
func (c *OfferContract) GetPendingAdminVerifications(ctx contractapi.TransactionContextInterface) ([]*Offer, error) {
	queryString := `{"selector":{"status":"ACCEPTED"}}`
	return c.queryOffers(ctx, queryString)
}

// queryOffers - helper function for querying offers
func (c *OfferContract) queryOffers(ctx contractapi.TransactionContextInterface, queryString string) ([]*Offer, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var offers []*Offer
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var offer Offer
		err = json.Unmarshal(queryResponse.Value, &offer)
		if err != nil {
			continue
		}
		offers = append(offers, &offer)
	}

	return offers, nil
}

// GetAllOffers retrieves all offers
func (c *OfferContract) GetAllOffers(ctx contractapi.TransactionContextInterface) ([]*Offer, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var offers []*Offer
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var offer Offer
		err = json.Unmarshal(queryResponse.Value, &offer)
		if err != nil {
			continue
		}
		offers = append(offers, &offer)
	}

	return offers, nil
}

// GetOfferHistory retrieves the history of an offer
func (c *OfferContract) GetOfferHistory(ctx contractapi.TransactionContextInterface, offerID string) ([]map[string]interface{}, error) {
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(offerID)
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

		var offer Offer
		if len(response.Value) > 0 {
			err = json.Unmarshal(response.Value, &offer)
			if err != nil {
				return nil, err
			}
		}

		record := map[string]interface{}{
			"txId":      response.TxId,
			"timestamp": response.Timestamp,
			"offer":     offer,
			"isDelete":  response.IsDelete,
		}
		history = append(history, record)
	}

	return history, nil
}

func main() {
	offerChaincode, err := contractapi.NewChaincode(&OfferContract{})
	if err != nil {
		fmt.Printf("Error creating offer chaincode: %v\n", err)
		return
	}

	if err := offerChaincode.Start(); err != nil {
		fmt.Printf("Error starting offer chaincode: %v\n", err)
	}
}
