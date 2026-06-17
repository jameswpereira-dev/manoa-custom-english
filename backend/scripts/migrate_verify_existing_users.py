"""
Script de execução única: marca todos os usuários existentes do Firebase
como email_verified=True, para que a nova exigência de verificação de
e-mail não afete contas criadas antes desta atualização.

NÃO execute este script automaticamente. Ele precisa do arquivo de
credenciais do Firebase (Service Account) que James precisa baixar
manualmente no Firebase Console.

Uso local:
  pip install firebase-admin
  python migrate_verify_existing_users.py
"""
import firebase_admin
from firebase_admin import credentials, auth

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

def main():
    page = auth.list_users()
    total = 0
    updated = 0
    while page:
        for user in page.users:
            total += 1
            if not user.email_verified:
                auth.update_user(user.uid, email_verified=True)
                updated += 1
                print(f"Verificado: {user.email}")
        page = page.get_next_page()
    print(f"\nConcluído. {updated} de {total} usuários marcados como verificados.")

if __name__ == "__main__":
    main()
