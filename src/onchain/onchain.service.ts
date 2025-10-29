
import { Injectable } from '@nestjs/common';
@Injectable()
export class OnchainService {
  async sendToAddress(asset:string, address:string, amount:number){
    // stubbed: replace with ethers/web3 provider logic
    return `tx_stub_${asset}_${Date.now()}`;
  }
}
