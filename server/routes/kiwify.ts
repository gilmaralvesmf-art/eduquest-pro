import express from 'express';
import * as admin from 'firebase-admin';
import firebaseConfig from '../../firebase-applet-config.json';

const router = express.Router();

// Inicializa o Firebase Admin SDK se ainda não estiver inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // Assume que o ambiente tem as credenciais padrão do GCP
    projectId: firebaseConfig.projectId,
  });
}

const db = admin.firestore();
// Especifica o banco de dados correto
db.settings({ databaseId: firebaseConfig.firestoreDatabaseId });

// Webhook da Kiwify
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    
    // A Kiwify envia um token de assinatura no header para validar a requisição
    // Em produção, você deve validar este token com o seu token da Kiwify
    const signature = req.headers['x-kiwify-signature'];
    
    console.log('Webhook Kiwify Recebido:', event.order_status, event.product_name);

    if (event.order_status === 'approved') {
      const customerEmail = event.Customer.email;
      const productName = event.product_name.toLowerCase();
      
      // Determinar o plano com base no nome do produto
      let plan: 'monthly' | 'quarterly' | 'semiannual' | 'annual' = 'monthly';
      let monthsToAdd = 1;

      if (productName.includes('trimestral')) {
        plan = 'quarterly';
        monthsToAdd = 3;
      } else if (productName.includes('semestral')) {
        plan = 'semiannual';
        monthsToAdd = 6;
      } else if (productName.includes('anual')) {
        plan = 'annual';
        monthsToAdd = 12;
      }

      // Buscar usuário pelo email
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', customerEmail).get();
      
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const currentData = userDoc.data();
        
        // Calcular nova data de expiração
        const now = new Date();
        let expiresAt = new Date();
        
        if (currentData.planExpiresAt && new Date(currentData.planExpiresAt) > now) {
           // Se já tem um plano ativo, adiciona o tempo ao final dele
           expiresAt = new Date(currentData.planExpiresAt);
        }
        
        expiresAt.setMonth(expiresAt.getMonth() + monthsToAdd);
        
        await userDoc.ref.update({
          subscriptionStatus: plan,
          planExpiresAt: expiresAt.toISOString(),
          'usage.assessmentsGenerated': 0, // Reseta o uso ao renovar/assinar
          'usage.correctionsMade': 0,
          'usage.lastResetDate': now.toISOString()
        });
        
        console.log(`Usuário ${customerEmail} atualizado para o plano ${plan}. Expira em: ${expiresAt.toISOString()}`);
      } else {
        console.log(`Usuário com email ${customerEmail} não encontrado no Firestore. Criando assinatura pendente.`);
        // Criar um registro de assinatura pendente
        const now = new Date();
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + monthsToAdd);

        await db.collection('pending_subscriptions').doc(customerEmail).set({
          email: customerEmail,
          plan: plan,
          expiresAt: expiresAt.toISOString(),
          createdAt: now.toISOString(),
          processed: false
        });
      }
      
      // Retornar sucesso para a Kiwify
      res.status(200).json({ received: true });
    } else {
      // Outros status (refunded, chargeback, etc)
      // Aqui você poderia implementar a lógica para cancelar a assinatura
      if (event.order_status === 'refunded' || event.order_status === 'chargeback') {
         const customerEmail = event.Customer.email;
         const usersRef = db.collection('users');
         const snapshot = await usersRef.where('email', '==', customerEmail).get();
         
         if (!snapshot.empty) {
           const userDoc = snapshot.docs[0];
           await userDoc.ref.update({
             subscriptionStatus: 'free',
             planExpiresAt: null
           });
           console.log(`Assinatura cancelada para o usuário ${customerEmail} devido a ${event.order_status}.`);
         }
      }
      res.status(200).json({ received: true });
    }
  } catch (error) {
    console.error('Erro no webhook da Kiwify:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
