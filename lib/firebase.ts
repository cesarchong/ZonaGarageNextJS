/* eslint-disable @typescript-eslint/no-explicit-any */
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from "firebase/auth" 
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, serverTimestamp, setDoc, updateDoc} from "firebase/firestore"
import { getStorage, uploadString, getDownloadURL, ref } from "firebase/storage";

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
      //TODO API DE PRODUCCION
    apiKey: "AIzaSyCKDAAtolpd03WEtX2pBLqRjN5mrY_q5K4",
  authDomain: "zonagaraje-41c74.firebaseapp.com",
  projectId: "zonagaraje-41c74",
  storageBucket: "zonagaraje-41c74.firebasestorage.app",
  messagingSenderId: "288279094036",
  appId: "1:288279094036:web:2ad1c3f4c98424db545801",
  measurementId: "G-F13163XZZM"      
  
  //TODO API DE DESARROLLO
//     apiKey: "AIzaSyDimjZnErbNsJiZFYw-MlhVeZSbyMTJTvs",
//   authDomain: "inventario-9e8d6.firebaseapp.com",
//   projectId: "inventario-9e8d6",
//   storageBucket: "inventario-9e8d6.firebasestorage.app",
//   messagingSenderId: "852902124288",
//   appId: "1:852902124288:web:18d8d9dabe04f0504fb1e5",
//   measurementId: "G-GKW8SRGH30"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);


//TODO Las FUNCIONES DEL AUTH //

//?CREAR NUEVO USUARIO///
export const createUser = async(user: {email: string, password:string}) => {
    return await createUserWithEmailAndPassword(auth, user.email, user.password)
}

//??ENTRAR CON EMAIL & CONTRASEÑA//

export const signIn = async(user: {email: string, password: string}) => {
    return await signInWithEmailAndPassword(auth, user.email, user.password);
}

//?ACTUALIZAR USUARIO//
export const updateUser = (user: { displayName?: string | null; photoURL?: string | null; }) => {
    if(auth.currentUser) return updateProfile(auth.currentUser, user)
}

//?CERRAR SESION//
export const sigOutAccount = () => {
    localStorage.removeItem('user');
    return auth.signOut();
}

//? RECUPERAR CONTRASEÑA//
export const sentResetEmail = (email: string) => {
    return sendPasswordResetEmail(auth, email)
}


//TODO FUNCIONES DATABASE///

export const getCollection = async(colectionName: string, queryArray?:any[]) => {
    const ref = collection(db, colectionName);
    const q = queryArray ? query(ref, ...queryArray) : query(ref);
    return (await getDocs(q)).docs.map((doc) => ({id: doc.id, ...doc.data()}));

}

//?OBTENER UN DOCUMENTO DE UNA COLECCION//
export const getDocument = async (path:string) => {
    return (await getDoc(doc(db, path))).data();
}



//?SETEAR UN DOCUMENTO EN UNA COLECCION//
export const setDocument = (path:string, data:any) => {
    data.createAt = serverTimestamp();
    return setDoc(doc(db, path), data)
}

//? ACTUALIZAR UN DOCUMENTO EN UNA COLECCION//
export const updateDocument = (path:string, data:any) => {
    return updateDoc(doc(db, path), data)
}

//? ELIMINAR UN DOCUMENTO DE UNA COLECCION//
export const deleteDocument = (path:string) => {
    return deleteDoc(doc(db, path))
}

//? AGREGAR UN DOCUMENTO //////
export const addDocument = (path:string, data:any) => {
    data.createAt = serverTimestamp();
    return addDoc(collection(db, path), data)
}

//?TODO ===== FUNCIONES DEL STORAGE====== ///

//! SUBIR UN ARCHIVO CON FORMATO BASE64 & OBTENER SU URL//
export const uploadBase64 = async (path: string, base64: string) => {
    return uploadString(ref(storage, path), base64, 'data_url').then(() => {
        return getDownloadURL(ref(storage, path))
    })
}