import { supabase } from '@/lib/supabase/client'

export interface StoreSettings {
    gcashQrUrl: string
    mayaQrUrl: string
}

export async function getStoreSettings(): Promise<StoreSettings> {
    try {
        const { data, error } = await supabase
            .from('store_settings')
            .select('key, value')

        if (error) throw error

        const settings = data.reduce((acc, { key, value }) => {
            if (key === 'epayment_gcash_qr_url') acc.gcashQrUrl = value || ''
            if (key === 'epayment_maya_qr_url') acc.mayaQrUrl = value || ''
            return acc
        }, {} as Partial<StoreSettings>)

        return {
            gcashQrUrl: settings.gcashQrUrl || '/mock-qr.png',
            mayaQrUrl: settings.mayaQrUrl || '/mock-qr.png',
        }
    } catch (err) {
        console.error('Error fetching store settings:', err)
        // Return default values in case of an error
        return {
            gcashQrUrl: '/mock-qr.png',
            mayaQrUrl: '/mock-qr.png',
        }
    }
}
