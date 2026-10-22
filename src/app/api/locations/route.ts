import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { LocationService } from '@/services/location.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'states';
    const state = searchParams.get('state') || '';
    const district = searchParams.get('district') || '';
    const taluk = searchParams.get('taluk') || '';
    const pincode = searchParams.get('pincode') || '';

    switch (action) {
      case 'states': {
        const states = LocationService.getStates();
        return ApiResponse.success(states, 'States retrieved successfully');
      }

      case 'districts': {
        if (!state) {
          return ApiResponse.badRequest('State parameter is required');
        }
        const districts = LocationService.getDistricts(state);
        return ApiResponse.success(districts, `Districts for ${state} retrieved`);
      }

      case 'taluks': {
        if (!district) {
          return ApiResponse.badRequest('District parameter is required');
        }
        const taluks = LocationService.getTaluks(state, district);
        return ApiResponse.success(taluks, `Taluks for ${district} retrieved`);
      }

      case 'villages': {
        if (!district) {
          return ApiResponse.badRequest('District parameter is required');
        }
        const villages = LocationService.getVillages(district, taluk);
        return ApiResponse.success(villages, `Villages retrieved`);
      }

      case 'pincode': {
        if (!pincode || pincode.length !== 6) {
          return ApiResponse.badRequest('A valid 6-digit PIN code is required');
        }
        const details = LocationService.lookupByPincode(pincode);
        if (!details) {
          return ApiResponse.notFound(`No postal records found for PIN code ${pincode}`);
        }
        return ApiResponse.success(details, `Location details for ${pincode} retrieved`);
      }

      default:
        return ApiResponse.badRequest(`Unknown action: ${action}`);
    }
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch location data', error);
  }
}
