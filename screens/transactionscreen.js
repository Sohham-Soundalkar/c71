import  React from 'react';
import {Text, View, StyleSheet, TouchableOpacity, TextInput, Image, Alert, KeyboardAvoidingView, ToastAndroid} from 'react-native';
import * as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner';
import firebase from 'firebase';
import db from '../config';

export default class Transactionscreen extends React.Component{
    constructor(){
        super();
        this.state={
            hasCameraPermissions: null,
            scanned: false,
            scannedBookID: '',
            scannedStudentID:'',
            buttonState: 'normal',
            transactionMessage: ''
        }
    }

    cameraPermissions=async(ID)=>{
        const {status} = await Permissions.askAsync(Permissions.CAMERA)
        this.setState({
            hasCameraPermissions: status==='granted',
            buttonState:ID,
            scanned: 'false'
        })
    }

    handleBarcodeScanned=async({type, data})=>{
        const {buttonState}=this.state
        if(buttonState==='BookID'){
            this.setState({
                scanned: true,
                scannedBookID: data,
                buttonState:'normal'
            })
            console.log('scannedBook ' + this.state.scannedBookID)
        }
        else if(buttonState==='StudentID'){
            this.setState({
                scanned: true,
                scannedStudentID: data,
                buttonState:'normal'
            })
            console.log('scannedStudent ' + this.state.scannedStudentID)
        }
    }
   
    initiateBookIssue=async()=>{
        db.collection('transactions').add({
            'bookID': this.state.scannedBookID,
            'studentID': this.state.scannedStudentID,
            'date': firebase.firestore.Timestamp.now().toDate(),
            'transactionstype': 'issue'
        })
        db.collection('books').doc(this.state.scannedBookID).update({
            'bookAvailablity': false
        })
        db.collection('students').doc(this.state.scannedStudentID).update({
            'noOfBooksIssued': firebase.firestore.FieldValue.increment(1)
        })
    }

    initiateBookReturn=async()=>{
        db.collection('transactions').add({
            'bookID': this.state.scannedBookID,
            'studentID': this.state.scannedStudentID,
            'date': firebase.firestore.Timestamp.now().toDate(),
            'transactionstype': 'return'
        })
        db.collection('books').doc(this.state.scannedBookID).update({
            'bookAvailablity': true
        })
        db.collection('students').doc(this.state.scannedStudentID).update({
            'noOfBooksIssued': firebase.firestore.FieldValue.increment(-1)
        })
    }

    handleTransaction=async()=>{
        var transactionMessage = null
        db.collection('books').doc(this.state.scannedBookID).get()
        .then((doc)=>{
            var book = doc.data()
            if(book.bookAvailablity){
                this.initiateBookIssue()
                transactionMessage = 'Book Issued'
                ToastAndroid.show(transactionMessage, ToastAndroid.SHORT)
            }
            else{
                this.initiateBookReturn()
                transactionMessage = 'Book Returned'
                ToastAndroid.show(transactionMessage, ToastAndroid.SHORT)
            }
        })
        this.setState({
            transactionMessage: transactionMessage
        })
      }

  render(){
      const hasCameraPermissions=this.state.hasCameraPermissions
      const scanned = this.state.scanned
      const buttonState = this.state.buttonState
      if(buttonState!=='normal' && hasCameraPermissions){
          return(
              <BarCodeScanner
              onBarCodeScanned = {scanned?undefined:this.handleBarcodeScanned}
              style={StyleSheet.absoluteFillObject}
              />
          )
      }
      else if(buttonState==='normal'){

      return(
          <KeyboardAvoidingView style={styles.container} behavior='padding' enabled>
          <View style={styles.container}>
              <View>
                  <Image
                  source={require('../assets/booklogo.jpg')}
                  style={{width:200, height:200}}
                  />
                  <Text style={{textAlign: 'center', fontSize:30}}>Wireless-Library</Text>
              </View>
              <View style={styles.inputView}>
                 <TextInput
                 style={styles.inputBox}
                 placeholder='Book ID'
                 onChangeText={text=>this.setState({scannedBookID:text})}
                 value = {this.state.scannedBookID}
                 /> 
                 <TouchableOpacity 
                     style={styles.scanButton}
                     onPress={()=>{
                         this.cameraPermissions('BookID')
                     }}>
                     <Text style={styles.buttonText}> Scan </Text>
                 </TouchableOpacity>
              </View>
              <View style={styles.inputView}>
                 <TextInput
                 style={styles.inputBox}
                 placeholder='Student ID'
                 onChangeText={text=>this.setState({scannedStudentID:text})}
                 value = {this.state.scannedStudentID}
                 /> 
                 <TouchableOpacity 
                     style={styles.scanButton}
                     onPress={()=>{
                         this.cameraPermissions('StudentID')
                     }}>
                     <Text style={styles.buttonText}> Scan </Text>
                 </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.submitButton}
              onPress={async()=>{
                  var transactionMessage = await this.handleTransaction()
                  this.setState({
                      scannedBookID:'',
                      scannedStudentID: ''
                  })}}>
                  <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
          </View>
          </KeyboardAvoidingView>
      )
  }
}
}

const styles = StyleSheet.create({
    container:{
        justifyContent: 'center',
        alignItems: 'center'
    },
    displayText:{
        fontSize: 15,
        textDecorationLine: 'underline'
    },
    scanButton:{
        backgroundColor: 'blue',
        width: 50,
        borderWidth: 1.5
    },
    buttonText:{
        fontSize: 15,
        textAlign: 'center',
        marginTop: 10,
        color: 'white'
    },
    inputView:{
        flexDirection: 'row',
        margin: 20
    },
    inputBox:{
        width: 200,
        height: 40,
        borderWidth: 1.5,
        fontSize: 20
    },
    submitButton:{
        backgroundColor: 'red',
        width: 100,
        height: 50
    },
    submitButtonText:{
        padding: 10,
        textAlign: 'center',
        fontSize: 20,
        color: 'white',
        fontWeight: 'bold'
    }
})