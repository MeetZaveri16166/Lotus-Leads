import { useState } from 'react';

export default function MigrationSQLPage() {
  const [copied, setCopied] = useState(false);

  const cleanupSQL = `-- Cleanup script to remove test data from failed signup attempts
-- Run this in your Supabase SQL Editor

-- Step 1: Find and delete test users and their related data
DO $$
DECLARE
  test_user_id UUID;
  test_org_id UUID;
BEGIN
  -- Find test users (adjust email pattern as needed)
  FOR test_user_id IN 
    SELECT id FROM auth.users 
    WHERE email LIKE '%test%' OR email LIKE '%john%' OR email LIKE '%acme%'
  LOOP
    -- Get their organization
    SELECT organization_id INTO test_org_id 
    FROM memberships 
    WHERE user_id = test_user_id 
    LIMIT 1;
    
    IF test_org_id IS NOT NULL THEN
      -- Delete in correct order (respecting foreign keys)
      DELETE FROM credit_ledger WHERE organization_id = test_org_id;
      DELETE FROM organization_wallets WHERE organization_id = test_org_id;
      DELETE FROM billing_accounts WHERE organization_id = test_org_id;
      DELETE FROM invitations WHERE organization_id = test_org_id;
      DELETE FROM memberships WHERE organization_id = test_org_id;
      DELETE FROM organizations WHERE id = test_org_id;
      RAISE NOTICE 'Deleted organization: %', test_org_id;
    END IF;
    
    -- Delete user profile
    DELETE FROM user_profiles WHERE user_id = test_user_id;
    
    -- Delete auth user
    DELETE FROM auth.users WHERE id = test_user_id;
    RAISE NOTICE 'Deleted user: %', test_user_id;
  END LOOP;
END $$;

-- Step 2: Verify cleanup
SELECT 'Users after cleanup:' as check_type, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'Organizations:', COUNT(*) FROM organizations
UNION ALL
SELECT 'Memberships:', COUNT(*) FROM memberships
UNION ALL
SELECT 'Wallets:', COUNT(*) FROM organization_wallets;
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanupSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🗄️ Database Cleanup SQL
          </h1>
          
          <div className="mb-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Warning: This will delete test data
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>This SQL script will remove users with test emails (containing 'test', 'john', or 'acme') and all their related data.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              How to use:
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
              <li>Copy the SQL below</li>
              <li>Go to your <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer" className="text-[#E64B8B] hover:underline">Supabase SQL Editor</a></li>
              <li>Paste and run the script</li>
              <li>Come back and try signing up again with fresh data</li>
            </ol>
          </div>

          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 px-4 py-2 bg-[#E64B8B] text-white rounded-lg hover:bg-[#d43d7a] transition-colors text-sm font-medium"
            >
              {copied ? '✓ Copied!' : 'Copy SQL'}
            </button>
            
            <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm">
              <code>{cleanupSQL}</code>
            </pre>
          </div>

          <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Alternative: Modify the pattern
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>If you want to delete different users, modify the email pattern in the WHERE clause:
                    <code className="bg-blue-100 px-1 py-0.5 rounded ml-1">WHERE email LIKE '%your-pattern%'</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
