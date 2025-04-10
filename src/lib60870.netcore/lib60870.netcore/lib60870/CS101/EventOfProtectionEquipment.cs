/*
 *  EventOfProtectionEquipment.cs
 *
 *  Copyright 2016-2025 Michael Zillgith
 *
 *  This file is part of lib60870.NET
 *
 *  lib60870.NET is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  lib60870.NET is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with lib60870.NET.  If not, see <http://www.gnu.org/licenses/>.
 *
 *  See COPYING file for the complete license text.
 */

namespace lib60870.CS101
{
    /// <summary>
    /// Event of protection equipment information object (M_EP_TA_1)
    /// </summary>
    public class EventOfProtectionEquipment : InformationObject
    {
        override public int GetEncodedSize()
        {
            return 6;
        }

        override public TypeID Type
        {
            get
            {
                return TypeID.M_EP_TA_1;
            }
        }

        override public bool SupportsSequence
        {
            get
            {
                return false;
            }
        }

        private SingleEvent singleEvent;

        public SingleEvent Event
        {
            get
            {
                return singleEvent;
            }
        }

        private CP16Time2a elapsedTime;

        public CP16Time2a ElapsedTime
        {
            get
            {
                return elapsedTime;
            }
        }

        private CP24Time2a timestamp;

        public CP24Time2a Timestamp
        {
            get
            {
                return timestamp;
            }
        }

        public EventOfProtectionEquipment(int ioa, SingleEvent singleEvent, CP16Time2a elapsedTime, CP24Time2a timestamp)
            : base(ioa)
        {
            this.singleEvent = singleEvent;
            this.elapsedTime = elapsedTime;
            this.timestamp = timestamp;
        }

        public EventOfProtectionEquipment(EventOfProtectionEquipment original)
            : base(original.ObjectAddress)
        {
            singleEvent = new SingleEvent(original.singleEvent);
            elapsedTime = new CP16Time2a(original.elapsedTime);
            timestamp = new CP24Time2a(original.timestamp);
        }

        internal EventOfProtectionEquipment(ApplicationLayerParameters parameters, byte[] msg, int startIndex, bool isSequence)
            : base(parameters, msg, startIndex, isSequence)
        {
            if (!isSequence)
                startIndex += parameters.SizeOfIOA; /* skip IOA */

            if ((msg.Length - startIndex) < GetEncodedSize())
                throw new ASDUParsingException("Message too small");

            singleEvent = new SingleEvent(msg[startIndex++]);

            elapsedTime = new CP16Time2a(msg, startIndex);
            startIndex += 2;

            /* parse CP56Time2a (time stamp) */
            timestamp = new CP24Time2a(msg, startIndex);
        }

        public override void Encode(Frame frame, ApplicationLayerParameters parameters, bool isSequence)
        {
            base.Encode(frame, parameters, isSequence);

            frame.SetNextByte(singleEvent.EncodedValue);

            frame.AppendBytes(elapsedTime.GetEncodedValue());

            frame.AppendBytes(timestamp.GetEncodedValue());
        }
    }

    /// <summary>
    /// Event of protection equipment information object with CP56Time2a time tag (M_EP_TD_1)
    /// </summary>
    public class EventOfProtectionEquipmentWithCP56Time2a : InformationObject
    {
        override public int GetEncodedSize()
        {
            return 10;
        }

        override public TypeID Type
        {
            get
            {
                return TypeID.M_EP_TD_1;
            }
        }

        override public bool SupportsSequence
        {
            get
            {
                return false;
            }
        }

        private SingleEvent singleEvent;

        public SingleEvent Event
        {
            get
            {
                return singleEvent;
            }
        }

        private CP16Time2a elapsedTime;

        public CP16Time2a ElapsedTime
        {
            get
            {
                return elapsedTime;
            }
        }

        private CP56Time2a timestamp;

        public CP56Time2a Timestamp
        {
            get
            {
                return timestamp;
            }
        }

        public EventOfProtectionEquipmentWithCP56Time2a(int ioa, SingleEvent singleEvent, CP16Time2a elapsedTime, CP56Time2a timestamp)
            : base(ioa)
        {
            this.singleEvent = singleEvent;
            this.elapsedTime = elapsedTime;
            this.timestamp = timestamp;
        }

        public EventOfProtectionEquipmentWithCP56Time2a(EventOfProtectionEquipmentWithCP56Time2a original)
            : base(original.ObjectAddress)
        {
            singleEvent = new SingleEvent(original.singleEvent);
            elapsedTime = new CP16Time2a(original.elapsedTime);
            timestamp = new CP56Time2a(original.timestamp);
        }

        internal EventOfProtectionEquipmentWithCP56Time2a(ApplicationLayerParameters parameters, byte[] msg, int startIndex, bool isSequence)
            : base(parameters, msg, startIndex, isSequence)
        {
            if (!isSequence)
                startIndex += parameters.SizeOfIOA; /* skip IOA */

            if ((msg.Length - startIndex) < GetEncodedSize())
                throw new ASDUParsingException("Message too small");

            singleEvent = new SingleEvent(msg[startIndex++]);

            elapsedTime = new CP16Time2a(msg, startIndex);
            startIndex += 2;

            /* parse CP56Time2a (time stamp) */
            timestamp = new CP56Time2a(msg, startIndex);
        }

        public override void Encode(Frame frame, ApplicationLayerParameters parameters, bool isSequence)
        {
            base.Encode(frame, parameters, isSequence);

            frame.SetNextByte(singleEvent.EncodedValue);

            frame.AppendBytes(elapsedTime.GetEncodedValue());

            frame.AppendBytes(timestamp.GetEncodedValue());
        }
    }
}

