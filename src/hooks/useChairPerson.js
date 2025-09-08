import React, { useEffect, useMemo, useState } from "react";
import { usePublicClient } from "wagmi";
import { QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI } from "../config/ABI";

const useChairPerson = () => {
    const [chairPerson, setChairPerson] = useState();
    const publicClient = usePublicClient();

    // const res = useReadContract({
    //     abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
    //     address: import.meta.env.VITE_QUADRATIC_GOVERNANCE_VOTING_CONTRACT,
    //     functionName: "chairperson",
    // });

    // const resultObject = JSON.parse(JSON.stringify(res));

    // //console.log("resultObject: ", resultObject.data);

    useEffect(() => {
        (async () => {
            const result = await publicClient.readContract({
                address: import.meta.env
                    .VITE_QUADRATIC_GOVERNANCE_VOTING_CONTRACT,
                abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                functionName: "chairperson",
            });
            setChairPerson(result);
        })();
    }, [publicClient]);

    return useMemo(() => chairPerson, [chairPerson]);
};

export default useChairPerson;
